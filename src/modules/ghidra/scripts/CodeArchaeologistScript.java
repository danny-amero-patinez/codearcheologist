// CodeArchaeologistScript.java
// Ghidra headless post-script for Code Archaeologist
//
// Usage (via analyzeHeadless -postScript):
//   -postScript CodeArchaeologistScript.java <output-json-path> <max-functions>
//
// NOTE: Do NOT insert -scriptArgs between the script name and its arguments.
// The correct Ghidra contract passes arguments directly after the script name.
//
// args[0] = absolute path to output JSON file
// args[1] = maximum number of functions to select/decompile (integer)
//
// SAFETY: This script performs STATIC analysis only. The program is never executed.
// Ghidra imports the binary and runs the disassembler/decompiler on its bytes.

import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.*;
import ghidra.program.model.address.*;
import ghidra.app.decompiler.*;
import com.google.gson.*;
import java.io.*;
import java.util.*;

public class CodeArchaeologistScript extends GhidraScript {

    @Override
    public void run() throws Exception {
        // ── Validate arguments ─────────────────────────────────────────────────
        if (args == null || args.length < 2) {
            printerr("CodeArchaeologistScript: expected args[0]=outputPath args[1]=maxFunctions");
            printerr("  Got " + (args == null ? "null" : args.length) + " argument(s)");
            return;
        }

        String outputPath = args[0];
        int maxFunctions;
        try {
            maxFunctions = Integer.parseInt(args[1]);
            if (maxFunctions <= 0) throw new NumberFormatException("must be positive");
        } catch (NumberFormatException e) {
            printerr("CodeArchaeologistScript: args[1] must be a positive integer, got: " + args[1]);
            return;
        }

        println("CodeArchaeologistScript: outputPath=" + outputPath + " maxFunctions=" + maxFunctions);

        // ── Collect all known import names (for scoring and edge resolution) ──
        Set<String> importNames = new HashSet<>();
        SymbolTable symbolTable = currentProgram.getSymbolTable();
        for (Symbol sym : symbolTable.getExternalSymbols()) {
            importNames.add(sym.getName());
        }

        // ── Build function list ────────────────────────────────────────────────
        FunctionManager functionManager = currentProgram.getFunctionManager();
        Address entryAddr = currentProgram.getImageBase();

        // Try to find real entry point
        try {
            SymbolIterator entrySymbols = symbolTable.getSymbols("entry");
            if (entrySymbols.hasNext()) {
                entryAddr = entrySymbols.next().getAddress();
            }
        } catch (Exception e) {
            // Fall back to image base
        }

        List<FunctionData> allFunctions = new ArrayList<>();
        for (Function fn : functionManager.getFunctions(true)) {
            FunctionData fd = buildFunctionData(fn, importNames, entryAddr);
            allFunctions.add(fd);
        }

        println("CodeArchaeologistScript: found " + allFunctions.size() + " functions");

        // ── Sort by score descending, select top N for decompilation ──────────
        allFunctions.sort((a, b) -> Double.compare(b.selectionScore, a.selectionScore));

        // ── Selective decompilation ────────────────────────────────────────────
        DecompInterface decompiler = new DecompInterface();
        decompiler.openProgram(currentProgram);

        int decompCount = Math.min(maxFunctions, allFunctions.size());
        for (int i = 0; i < decompCount; i++) {
            FunctionData fd = allFunctions.get(i);
            try {
                Function fn = functionManager.getFunctionAt(toAddr(fd.address));
                if (fn == null) continue;
                DecompileResults result = decompiler.decompileFunction(fn, 30, monitor);
                if (result != null && result.decompileCompleted()) {
                    DecompiledFunction decomp = result.getDecompiledFunction();
                    fd.decompilation = decomp != null ? decomp.getC() : null;
                }
            } catch (Exception e) {
                println("  Decompile failed for " + fd.name + ": " + e.getMessage());
            }
        }

        decompiler.dispose();

        // ── Build JSON output ──────────────────────────────────────────────────
        JsonObject result = new JsonObject();
        result.addProperty("programLanguage", currentProgram.getLanguageID().toString());
        result.addProperty("entryPoint", entryAddr.toString());
        result.addProperty("totalFunctions", allFunctions.size());

        JsonArray functionsArray = new JsonArray();
        for (FunctionData fd : allFunctions) {
            functionsArray.add(fd.toJson());
        }
        result.add("functions", functionsArray);

        // ── Write output ───────────────────────────────────────────────────────
        File outFile = new File(outputPath);
        File parentDir = outFile.getParentFile();
        if (parentDir != null) parentDir.mkdirs();

        try (FileWriter writer = new FileWriter(outFile)) {
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            writer.write(gson.toJson(result));
        }

        println("CodeArchaeologistScript: output written to " + outputPath +
                " (" + allFunctions.size() + " functions, " + decompCount + " decompiled)");
    }

    // ── Build function data ────────────────────────────────────────────────────

    private FunctionData buildFunctionData(Function fn, Set<String> importNames, Address entryAddr) {
        FunctionData fd = new FunctionData();
        fd.address = fn.getEntryPoint().toString();
        fd.name = fn.getName();
        fd.autoGenerated = isAutoGenerated(fn.getName());

        // Callers (functions that call this one)
        fd.callers = new ArrayList<>();
        for (Function caller : fn.getCallingFunctions(monitor)) {
            fd.callers.add(caller.getEntryPoint().toString());
        }

        // Callees (functions this one calls)
        fd.callees = new ArrayList<>();
        Set<Function> calledFunctions = fn.getCalledFunctions(monitor);
        for (Function callee : calledFunctions) {
            fd.callees.add(callee.getEntryPoint().toString());
        }

        // Referenced imports (external symbols called from this function)
        fd.referencedImports = new ArrayList<>();
        for (Function callee : calledFunctions) {
            if (callee.isExternal()) {
                fd.referencedImports.add(callee.getName());
            }
        }

        // Referenced strings (string data referenced by this function)
        fd.referencedStrings = new ArrayList<>();
        try {
            AddressSetView body = fn.getBody();
            ghidra.program.model.listing.InstructionIterator instrIter =
                currentProgram.getListing().getInstructions(body, true);
            while (instrIter.hasNext()) {
                ghidra.program.model.listing.Instruction instr = instrIter.next();
                for (ghidra.program.model.scalar.Scalar scalar : instr.getScalarObjects()) {
                    Address refAddr = toAddr(scalar.getUnsignedValue());
                    if (refAddr == null) continue;
                    ghidra.program.model.listing.Data data =
                        currentProgram.getListing().getDataAt(refAddr);
                    if (data != null && data.hasStringValue()) {
                        Object val = data.getValue();
                        if (val instanceof String) {
                            String s = (String) val;
                            if (s.length() >= 4 && !fd.referencedStrings.contains(s)) {
                                fd.referencedStrings.add(s);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            // String ref extraction is best-effort
        }

        // ── Scoring ────────────────────────────────────────────────────────────
        fd.selectionScore = 0.0;
        fd.selectionReasons = new ArrayList<>();

        // Import references (most valuable signal)
        if (!fd.referencedImports.isEmpty()) {
            fd.selectionScore += fd.referencedImports.size() * 2.0;
            fd.selectionReasons.add("references " + fd.referencedImports.size() + " import(s)");
        }

        // String references
        if (!fd.referencedStrings.isEmpty()) {
            fd.selectionScore += fd.referencedStrings.size() * 1.5;
            fd.selectionReasons.add("references " + fd.referencedStrings.size() + " string(s)");
        }

        // Connectivity (callers/callees — functions at network hubs are interesting)
        int connectivity = fd.callers.size() + fd.callees.size();
        if (connectivity > 0) {
            fd.selectionScore += Math.min(connectivity * 0.5, 5.0);
            fd.selectionReasons.add("connectivity=" + connectivity);
        }

        // Entry-point proximity (functions near entry are likely important init code)
        try {
            Address fnAddr = fn.getEntryPoint();
            long distance = Math.abs(fnAddr.subtract(entryAddr));
            if (distance < 0x1000) {
                fd.selectionScore += 3.0;
                fd.selectionReasons.add("near entry point");
            }
        } catch (Exception e) {
            // Distance calculation failed — skip
        }

        // Auto-generated names get a slight penalty (less interesting than named functions)
        if (fd.autoGenerated) {
            fd.selectionScore -= 1.0;
        } else {
            fd.selectionScore += 1.0;
            fd.selectionReasons.add("named function");
        }

        return fd;
    }

    private boolean isAutoGenerated(String name) {
        return name != null && name.matches("FUN_[0-9a-fA-F]+");
    }

    // ── Inner data class ───────────────────────────────────────────────────────

    private static class FunctionData {
        String address;
        String name;
        boolean autoGenerated;
        List<String> callers;
        List<String> callees;
        List<String> referencedImports;
        List<String> referencedStrings;
        double selectionScore;
        List<String> selectionReasons;
        String decompilation;

        JsonObject toJson() {
            JsonObject obj = new JsonObject();
            obj.addProperty("address", address);
            obj.addProperty("name", name);
            obj.addProperty("autoGenerated", autoGenerated);

            JsonArray callersArr = new JsonArray();
            for (String c : callers) callersArr.add(c);
            obj.add("callers", callersArr);

            JsonArray calleesArr = new JsonArray();
            for (String c : callees) calleesArr.add(c);
            obj.add("callees", calleesArr);

            JsonArray importsArr = new JsonArray();
            for (String s : referencedImports) importsArr.add(s);
            obj.add("referencedImports", importsArr);

            JsonArray stringsArr = new JsonArray();
            for (String s : referencedStrings) stringsArr.add(s);
            obj.add("referencedStrings", stringsArr);

            obj.addProperty("selectionScore", selectionScore);

            JsonArray reasonsArr = new JsonArray();
            for (String r : selectionReasons) reasonsArr.add(r);
            obj.add("selectionReasons", reasonsArr);

            if (decompilation != null) {
                obj.addProperty("decompilation", decompilation);
            } else {
                obj.add("decompilation", JsonNull.INSTANCE);
            }

            return obj;
        }
    }
}
