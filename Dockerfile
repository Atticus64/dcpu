# syntax=docker/dockerfile:1
# Stage 1: build frontend
FROM node:22-bookworm AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json tsconfig.vitest.json index.html env.d.ts ./
COPY src/ src/
COPY public/ public/
RUN pnpm run build

# Stage 2: runtime with Deno + dosbox-staging + JWasm (headless offscreen, no xorg)
FROM fedora:41
RUN dnf install -y dosbox-staging make gcc git unzip curl \
    && dnf clean all \
    && curl -fsSL https://deno.land/install.sh | sh \
    && ln -s /root/.deno/bin/deno /usr/local/bin/deno \
    && deno --version \
    && dosbox-staging --version || dosbox --version

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server/ ./server/
COPY tools/ ./tools/
COPY public/ ./public/
COPY scripts/ ./scripts/
COPY package.json ./

# Build JWasm native (respects .gitignore tools/jwasm/jwasm)
RUN bash scripts/setup-fedora.sh || (echo "fallback jwasm build" && make -f GccUnix.mak CC="gcc -std=gnu17" -j$(nproc) -C /tmp 2>/dev/null || true)

ENV PORT=3001
ENV DOSBOX_PATH=/usr/bin/dosbox-staging
ENV JWASM_PATH=/app/tools/jwasm/jwasm
ENV SDL_VIDEODRIVER=offscreen
ENV SDL_AUDIODRIVER=dummy
ENV SDL_RENDER_DRIVER=software
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["deno","run","--allow-net","--allow-read","--allow-write","--allow-run","--allow-env","server/main.ts"]
