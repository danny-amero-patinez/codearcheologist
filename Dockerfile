# ─────────────────────────────────────────────────────────────────────────────
# Code Archaeologist — Production Dockerfile
# Target: IBM Cloud Code Engine (Linux/amd64)
#
# Layer order is intentional:
#   1. System packages (Java 21, wget, unzip)
#   2. Ghidra download + install
#   3. Node.js backend dependencies + TypeScript build
#   4. Frontend (Astro) build
#   5. Minimal runtime image — single final stage
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build backend ────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS backend-build

WORKDIR /build

# Copy manifests first for better layer caching
COPY package.json package-lock.json ./

# Install all deps (including devDependencies — needed for tsc)
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/

# Compile TypeScript and copy non-TS assets (Ghidra Java script)
RUN npm run build


# ── Stage 2: Build frontend ───────────────────────────────────────────────────
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./

# esbuild requires native binaries; allow scripts
RUN npm ci

COPY frontend/ .

# Astro static build → frontend/dist/
RUN npm run build


# ── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime

# ── System dependencies ────────────────────────────────────────────────────
# wget + unzip are used only during the Ghidra install below; ca-certificates
# is needed for HTTPS downloads; procps aids container debugging (optional).
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        wget \
        unzip \
        # Java 21 (Temurin via Eclipse Adoptium)
        # bookworm-slim ships openjdk-17; use Adoptium for 21
    && rm -rf /var/lib/apt/lists/*

# ── Java 21 (Temurin) ─────────────────────────────────────────────────────
# Eclipse Adoptium Temurin 21 LTS — required by Ghidra 12.x
ENV JAVA_HOME=/opt/java/21
RUN set -eux; \
    ARCH="$(dpkg --print-architecture)"; \
    case "$ARCH" in \
        amd64)  JDK_URL="https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_x64_linux_hotspot_21.0.5_11.tar.gz" ;; \
        arm64)  JDK_URL="https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_aarch64_linux_hotspot_21.0.5_11.tar.gz" ;; \
        *)      echo "Unsupported arch: $ARCH" && exit 1 ;; \
    esac; \
    mkdir -p /opt/java; \
    wget -q -O /tmp/jdk.tar.gz "$JDK_URL"; \
    tar -xzf /tmp/jdk.tar.gz -C /opt/java; \
    mv /opt/java/jdk-21.0.5+11 /opt/java/21; \
    rm /tmp/jdk.tar.gz

ENV PATH="${JAVA_HOME}/bin:${PATH}"

# ── Ghidra 12.1.4 ─────────────────────────────────────────────────────────
# Validated version used in production; requires Java 21.
ENV GHIDRA_HOME=/opt/ghidra
ENV GHIDRA_VERSION=12.1.4
ENV GHIDRA_DATE=20260921

RUN set -eux; \
    GHIDRA_ZIP="ghidra_${GHIDRA_VERSION}_PUBLIC_${GHIDRA_DATE}.zip"; \
    wget -q -O /tmp/ghidra.zip \
        "https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_${GHIDRA_VERSION}_build/${GHIDRA_ZIP}"; \
    unzip -q /tmp/ghidra.zip -d /tmp/ghidra-unzip; \
    mv "/tmp/ghidra-unzip/ghidra_${GHIDRA_VERSION}_PUBLIC" "${GHIDRA_HOME}"; \
    rm -rf /tmp/ghidra.zip /tmp/ghidra-unzip; \
    # Ensure analyzeHeadless is executable
    chmod +x "${GHIDRA_HOME}/support/analyzeHeadless"

# Remove wget/unzip now that Ghidra is installed (reduce attack surface)
RUN apt-get purge -y --auto-remove wget unzip

# ── Application ───────────────────────────────────────────────────────────
WORKDIR /app

# Production Node deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Backend build output (compiled JS + Ghidra Java script)
COPY --from=backend-build /build/dist/ ./dist/

# Frontend static files → served by Express in production
COPY --from=frontend-build /build/frontend/dist/ ./public/

# ── Runtime environment ───────────────────────────────────────────────────
# PORT is injected by IBM Code Engine; default 8080.
# HOST must be 0.0.0.0 so the container accepts external traffic.
# WORK_DIR is ephemeral inside the container (no persistent volume needed).
ENV PORT=8080
ENV HOST=0.0.0.0
ENV WORK_DIR=/tmp/codearcheologist-work
ENV GHIDRA_HOME=/opt/ghidra
ENV NODE_ENV=production

# Unprivileged user for security best practice
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup --no-create-home appuser && \
    mkdir -p /tmp/codearcheologist-work && \
    chown appuser:appgroup /tmp/codearcheologist-work
USER appuser

EXPOSE 8080

CMD ["node", "dist/app/server.js"]
