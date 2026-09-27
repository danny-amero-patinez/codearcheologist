# Deploying Code Archaeologist to IBM Cloud Code Engine

## Prerequisites

| Tool | Version |
|------|---------|
| IBM Cloud CLI | latest (`ibmcloud`) |
| Code Engine CLI plugin | `ibmcloud plugin install code-engine` |
| Docker (local build/push) | 20.x+ |
| IBM Container Registry (ICR) namespace | pre-created |

---

## 1. Build and push the image

```bash
# 1a. Log in to IBM Cloud
ibmcloud login --sso          # or: ibmcloud login -u <EMAIL> -p <PASSWORD>

# 1b. Target your region and resource group
ibmcloud target -r us-south -g <RESOURCE_GROUP>

# 1c. Log Docker into IBM Container Registry
ibmcloud cr login

# 1d. Build the image (from the project root)
docker build -t us.icr.io/<YOUR_ICR_NAMESPACE>/codearcheologist:latest .

# 1e. Push
docker push us.icr.io/<YOUR_ICR_NAMESPACE>/codearcheologist:latest
```

> **Note:** Replace `us-south` / `us.icr.io` with your chosen region prefix
> (`eu.icr.io`, `au.icr.io`, etc.).

---

## 2. Create or target a Code Engine project

```bash
# Create a new project (once)
ibmcloud ce project create --name codearcheologist

# Or select an existing one
ibmcloud ce project select --name codearcheologist
```

---

## 3. Grant Code Engine access to the ICR image

Code Engine needs an image pull secret to fetch from ICR.

```bash
ibmcloud ce registry create \
  --name icr-secret \
  --server us.icr.io \
  --username iamapikey \
  --password <IAM_API_KEY>
```

---

## 4. Deploy the application

```bash
ibmcloud ce application create \
  --name codearcheologist \
  --image us.icr.io/<YOUR_ICR_NAMESPACE>/codearcheologist:latest \
  --registry-secret icr-secret \
  --port 8080 \
  --cpu 4 \
  --memory 8G \
  --min-scale 1 \
  --max-scale 3 \
  --env HOST=0.0.0.0 \
  --env PORT=8080 \
  --env NODE_ENV=production \
  --env GHIDRA_HOME=/opt/ghidra \
  --env WORK_DIR=/tmp/codearcheologist-work
```

To update after a new image push:

```bash
ibmcloud ce application update \
  --name codearcheologist \
  --image us.icr.io/<YOUR_ICR_NAMESPACE>/codearcheologist:latest
```

---

## 5. Environment variables

| Variable | Required | Default in image | Description |
|----------|----------|-----------------|-------------|
| `PORT` | No | `8080` | HTTP port (Code Engine injects this automatically) |
| `HOST` | No | `0.0.0.0` | Bind address — must be `0.0.0.0` in a container |
| `NODE_ENV` | Recommended | _(unset)_ | Set to `production` |
| `GHIDRA_HOME` | No | `/opt/ghidra` | Path to the Ghidra installation inside the image |
| `WORK_DIR` | No | `/tmp/codearcheologist-work` | Ephemeral analysis scratch directory |
| `GHIDRA_TIMEOUT_MS` | No | `180000` | Max milliseconds to wait for a Ghidra run (default 3 min) |
| `MAX_GHIDRA_FUNCTIONS` | No | `20` | Max functions passed to Ghidra per analysis |
| `MAX_BINARY_BYTES` | No | `104857600` | Max upload size in bytes (default 100 MB) |
| `MAX_STRINGS` | No | `5000` | Max strings extracted per binary |

> **Note:** Analysis artefacts (uploaded binaries, Ghidra output, logs) are
> written to `WORK_DIR` which lives in the container's ephemeral `/tmp`.
> They are lost on container restart. This is intentional — no persistent
> storage or database is required.

---

## 6. Recommended CPU / RAM for Ghidra

Ghidra headless analysis is memory-intensive.

| Workload | CPU | Memory |
|----------|-----|--------|
| Small binaries (< 1 MB), low concurrency | 2 vCPU | 4 GB |
| Medium binaries (1–10 MB), moderate concurrency | 4 vCPU | 8 GB |
| Large binaries or high concurrency | 6–8 vCPU | 16 GB |

The recommended starting point (used in step 4 above) is **4 vCPU / 8 GB**.

IBM Code Engine billing is per instance-second, so scaling to 0 is possible if
you can tolerate cold-start latency (Ghidra JVM startup adds ~15–30 s on first
request). Set `--min-scale 1` to keep one instance warm.

---

## 7. Obtain the public application URL

After deployment, retrieve the URL with:

```bash
ibmcloud ce application get --name codearcheologist --output json \
  | grep '"url"'
```

Or in table form:

```bash
ibmcloud ce application list
```

The URL looks like:
`https://codearcheologist.<RANDOM>.us-south.codeengine.appdomain.cloud`

Test the health endpoint immediately after deployment:

```bash
curl https://codearcheologist.<RANDOM>.us-south.codeengine.appdomain.cloud/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## 8. Local Docker validation (before pushing to ICR)

```bash
# Build
docker build -t codearcheologist:local .

# Run — mirrors the Code Engine environment
docker run --rm \
  -p 8080:8080 \
  -e HOST=0.0.0.0 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  codearcheologist:local

# In another terminal
curl http://localhost:8080/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}

curl http://localhost:8080/api/v1/tools
# Shows Ghidra and Java availability inside the container
```

> **Build time note:** The first Docker build downloads Java 21 (~190 MB) and
> Ghidra 11.3.2 (~570 MB). Subsequent builds use the cached layer unless the
> `FROM` or install commands change.

---

## 9. Updating the image

```bash
# Rebuild, retag, push
docker build -t us.icr.io/<YOUR_ICR_NAMESPACE>/codearcheologist:latest .
docker push us.icr.io/<YOUR_ICR_NAMESPACE>/codearcheologist:latest

# Trigger a rolling update in Code Engine
ibmcloud ce application update --name codearcheologist \
  --image us.icr.io/<YOUR_ICR_NAMESPACE>/codearcheologist:latest
```
