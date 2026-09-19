#!/usr/bin/env bash
set -euo pipefail
# dcpu - setup Fedora Linux x86_64 - provee jwasm para server/sandbox/assembly.ts
# Compila JWasm desde fuentes via GccUnix.mak (tools/jwasm/Readme.txt)
# No requiere commitear binario; respeta .gitignore

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JWASM_LOCAL="$REPO_ROOT/tools/jwasm/jwasm"

# 0) Ya disponible?
if command -v jwasm >/dev/null 2>&1; then
  echo "[setup-fedora] jwasm en PATH: $(jwasm -h 2>&1 | head -1)"
  jwasm -h 2>&1 | grep -q "\-mz" || { echo "[setup-fedora] jwasm en PATH sin soporte -mz" >&2; exit 1; }
  exit 0
fi
if [ -x "$JWASM_LOCAL" ]; then
  echo "[setup-fedora] tools/jwasm/jwasm ya existe"
  if "$JWASM_LOCAL" -h 2>&1 | grep -q "\-mz"; then
    file "$JWASM_LOCAL" | grep -q "ELF 64-bit" || true
    exit 0
  fi
  echo "[setup-fedora] binario existente sin -mz, recompilando..."
fi

# 1) Dependencias Fedora (dnf/dnf5)
if ! command -v dnf >/dev/null 2>&1; then
  echo "[setup-fedora] dnf no encontrado. Este script es para Fedora Linux." >&2
  exit 1
fi

echo "[setup-fedora] Verificando dependencias (make gcc git)..."
# Usa dnf; en Fedora 43 dnf es symlink a dnf5
if ! command -v make >/dev/null 2>&1 || ! command -v gcc >/dev/null 2>&1 || ! command -v git >/dev/null 2>&1; then
  echo "[setup-fedora] Instalando dependencias faltantes..."
  if sudo -n true 2>/dev/null; then
    sudo dnf install -y make gcc git
  else
    echo "[setup-fedora] sudo sin passwordless; intenta manualmente: sudo dnf install -y make gcc git" >&2
    echo "[setup-fedora] Continuando si ya están instalados..." >&2
    command -v make >/dev/null 2>&1 || { echo "make no encontrado" >&2; exit 1; }
    command -v gcc >/dev/null 2>&1 || { echo "gcc no encontrado" >&2; exit 1; }
    command -v git >/dev/null 2>&1 || { echo "git no encontrado" >&2; exit 1; }
  fi
else
  echo "[setup-fedora] Dependencias OK: make $(make --version | head -1), gcc $(gcc --version | head -1 | awk '{print $3}'), git $(git --version | awk '{print $3}')"
fi

# 2) Build JWasm desde upstream
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "[setup-fedora] Clonando JWasm..."
if ! git clone --depth 1 https://github.com/JWasm/JWasm.git "$tmp/JWasm" 2>&1; then
  echo "[setup-fedora] git clone fallo, intentando tarball..." >&2
  curl -L https://github.com/JWasm/JWasm/archive/refs/heads/master.tar.gz | tar -xz -C "$tmp"
  mv "$tmp"/JWasm-master "$tmp/JWasm"
fi

echo "[setup-fedora] Compilando GccUnix.mak (CC=gcc -std=gnu17 para GCC 15+)..."
make -C "$tmp/JWasm" -f GccUnix.mak CC="gcc -std=gnu17" -j"$(nproc)"

# Binario resultante: GccUnixR/jwasm (según GccUnix.mak)
src_bin=""
for cand in "$tmp/JWasm/GccUnixR/jwasm" "$tmp/JWasm/jwasm" "$tmp/JWasm/gcc/jwasm"; do
  if [ -x "$cand" ]; then src_bin="$cand"; break; fi
done
if [ -z "$src_bin" ]; then
  echo "[setup-fedora] No se encontró binario jwasm tras make" >&2
  find "$tmp/JWasm" -type f -name "jwasm" | head -20 >&2
  exit 1
fi

mkdir -p "$(dirname "$JWASM_LOCAL")"
cp "$src_bin" "$JWASM_LOCAL"
chmod +x "$JWASM_LOCAL"

# 3) Verificación
echo "[setup-fedora] Verificando..."
"$JWASM_LOCAL" -h 2>&1 | grep -q "\-mz" || { echo "[setup-fedora] jwasm sin soporte -mz" >&2; "$JWASM_LOCAL" -h >&2; exit 1; }
file "$JWASM_LOCAL" || true
echo "[setup-fedora] OK: $("$JWASM_LOCAL" -h 2>&1 | head -1) -> $JWASM_LOCAL"
echo "[setup-fedora] Tip: export JWASM_PATH=$JWASM_LOCAL  # o deja que server lo autodetecte"
echo "[setup-fedora] Para instalar global: sudo cp $JWASM_LOCAL /usr/local/bin/jwasm"
