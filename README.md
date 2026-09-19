# DCPU — Learn Assembly & C

An interactive platform for learning x86 assembly (Turbo Assembler IDEAL mode) and C programming. Built with Vue 3, Monaco Editor, Deno backend.

---

## 🇺🇸 English

### Prerequisites

- **Node.js** >= 22.18 (or >= 24.12)
- **pnpm** (install with `npm i -g pnpm`)
- **Deno** >= 2 (download from [deno.com](https://deno.com))
- **JWasm** — included at `tools/jwasm/JWasm.exe` (Windows) or built via `scripts/setup-fedora.sh` (Fedora/Linux)
- **TCC (Tiny C Compiler)** — included at `tools/tcc/tcc/tcc.exe` (Windows); on Linux `gcc` is used

#### Fedora Linux (x86_64)

For TASM 16-bit (`ideal`, `model small`, `int 21h`) the server needs a native `jwasm` binary. On Fedora:

```sh
sudo dnf install -y make gcc git      # required for building JWasm
bash scripts/setup-fedora.sh          # clones JWasm, runs GccUnix.mak, installs to tools/jwasm/jwasm
# optional global install:
# sudo cp tools/jwasm/jwasm /usr/local/bin/jwasm
# verify:
jwasm -h | grep -q "\-mz" && echo "jwasm ready"
# or tools/jwasm/jwasm -h | grep -q "\-mz"

# alternative: use JWASM_PATH env
JWASM_PATH=./tools/jwasm/jwasm deno task --cwd server dev
```

The backend auto-resolves `jwasm` in order: `$JWASM_PATH` → `/usr/local/bin/jwasm` → `/usr/bin/jwasm` → `tools/jwasm/jwasm` → `jwasm` in `PATH` (`server/sandbox/assembly.ts`).

### Frontend (Vue 3 + Vite)

```sh
pnpm install
npm run dev              # dev server → http://localhost:5173
npm run build            # production build → dist/
npm run type-check       # run vue-tsc
npm run lint             # oxlint + eslint
npm run test:unit        # vitest
```

### Backend (Deno + Oak)

The compiler API compiles assembly (via JWasm) and C (via TCC). Run on port **3001**:

```sh
cd server
deno task dev            # http://localhost:3001
```

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/compile` | Compile code |
| POST | `/api/compile` body | `{ code: string, language: "assembly" \| "c" }` |
| WS | `/api/compile/c/ws` | Live C session (compile + run with streaming stdin/stdout) |

The Playground runs assembly programs in DOSBox (js-dos). For **C** it opens a live terminal session: the backend compiles with TCC and executes the program with a piped stdin, streaming stdout over a WebSocket — so `printf` output and `scanf` input both work. Messages: client sends `{ type: "compile", code }` and `{ type: "input", data }`; server replies `{ type: "ready" }`, `{ type: "output", stream, data }`, `{ type: "exit", code }`, `{ type: "error", message }`.

### Project Structure

```
dcpu/
├── src/                    # Vue 3 frontend
│   ├── assets/             # CSS themes, base styles
│   ├── components/
│   │   ├── exercises/      # MultipleChoice, ReorderLines, CodeExercise
│   │   ├── layout/         # AppHeader, ThemePicker, LanguagePicker
│   │   └── lesson/         # LessonRenderer (markdown + Monaco colorize)
│   ├── data/
│   │   ├── lessons/{en,es}/   # Markdown lesson content
│   │   └── exercises/{en,es}/ # Exercise definitions (JSON)
│   ├── locales/            # i18n dictionaries (en.ts, es.ts)
│   ├── stores/             # Pinia: theme, locale, progress
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Monaco themes & x86asm language
│   └── views/              # HomeView, LessonView, BlogView, BlogPostView
├── server/                 # Deno backend
│   ├── routes/compile.ts   # POST /api/compile
│   └── sandbox/            # assembly.ts, c.ts (compile + run)
└── tools/
    ├── jwasm/              # JWasm assembler
    └── tcc/                # Tiny C Compiler
```

### Adding Content

**Lessons** — create a markdown file in `src/data/lessons/{lang}/{id}.md` with frontmatter (`title`, `lesson`).

**Exercises** — create a JSON file in `src/data/exercises/{lang}/{id}.json` with an `exercises` array. Supported types: `multiple-choice`, `reorder-lines`, `code`.

**Blog posts** — add a `{id}` entry to the `posts` array in `BlogView.vue`, add `"blog.post.{id}.title"`, `"blog.post.{id}.desc"`, and `"blog.post.{id}.body"` keys to both locale files. Blog post bodies support markdown with code blocks.

**New language** — add the code to the `LOCALES` array in `src/stores/locale.ts`, create `src/locales/{lang}.ts`, and add `src/data/lessons/{lang}/` + `src/data/exercises/{lang}/` directories with translated content.

### Architecture Notes

- **Monaco Editor** for code exercises and static syntax highlighting (via `colorize()`).
- **CSS theming** via `data-theme` attribute on `<html>`; Monaco theme syncs with `editor.setTheme()`.
- **i18n** via simple `Record<string, string>` dictionaries + Pinia store (no vue-i18n).
- **Progress** stored in localStorage and persisted across sessions.

---

## 🇪🇸 Español

### Requisitos

- **Node.js** >= 22.18 (o >= 24.12)
- **pnpm** (instalar con `npm i -g pnpm`)
- **Deno** >= 2 (descargar de [deno.com](https://deno.com))
- **JWasm** — incluido en `tools/jwasm/JWasm.exe` (Windows) o compilado con `scripts/setup-fedora.sh` (Fedora/Linux)
- **TCC (Tiny C Compiler)** — incluido en `tools/tcc/tcc/tcc.exe` (Windows); en Linux se usa `gcc`

#### Fedora Linux (x86_64)

Para TASM 16-bit (`ideal`, `model small`, `int 21h`) el server necesita `jwasm` nativo. En Fedora:

```sh
sudo dnf install -y make gcc git      # requerido para compilar JWasm
bash scripts/setup-fedora.sh          # clona JWasm, ejecuta GccUnix.mak, instala en tools/jwasm/jwasm
# instalación global opcional:
# sudo cp tools/jwasm/jwasm /usr/local/bin/jwasm
# verificar:
jwasm -h | grep -q "\-mz" && echo "jwasm listo"
# o tools/jwasm/jwasm -h | grep -q "\-mz"

# alternativa con variable de entorno:
JWASM_PATH=./tools/jwasm/jwasm deno task --cwd server dev
```

El backend resuelve `jwasm` en orden: `$JWASM_PATH` → `/usr/local/bin/jwasm` → `/usr/bin/jwasm` → `tools/jwasm/jwasm` → `jwasm` en `PATH` (`server/sandbox/assembly.ts`).

### Frontend (Vue 3 + Vite)

```sh
pnpm install
npm run dev              # servidor dev → http://localhost:5173
npm run build            # compilación producción → dist/
npm run type-check       # ejecutar vue-tsc
npm run lint             # oxlint + eslint
npm run test:unit        # vitest
```

### Backend (Deno + Oak)

La API del compilador compila assembly (con JWasm) y C (con TCC). Ejecutar en el puerto **3001**:

```sh
cd server
deno task dev            # http://localhost:3001
```

**Endpoints:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Verificar estado |
| POST | `/api/compile` | Compilar código |
| POST | `/api/compile` body | `{ code: string, language: "assembly" \| "c" }` |
| WS | `/api/compile/c/ws` | Sesión C en vivo (compilar + ejecutar con stdin/stdout en streaming) |

El Playground ejecuta programas assembly en DOSBox (js-dos). Para **C** abre una sesión de terminal en vivo: el backend compila con TCC y ejecuta el programa con stdin pipeado, transmitiendo stdout por WebSocket — así funcionan tanto `printf` como `scanf`. Mensajes: el cliente envía `{ type: "compile", code }` y `{ type: "input", data }`; el servidor responde `{ type: "ready" }`, `{ type: "output", stream, data }`, `{ type: "exit", code }`, `{ type: "error", message }`.

### Estructura del Proyecto

```
dcpu/
├── src/                    # Frontend Vue 3
│   ├── assets/             # Temas CSS, estilos base
│   ├── components/
│   │   ├── exercises/      # MultipleChoice, ReorderLines, CodeExercise
│   │   ├── layout/         # AppHeader, ThemePicker, LanguagePicker
│   │   └── lesson/         # LessonRenderer (markdown + Monaco colorize)
│   ├── data/
│   │   ├── lessons/{en,es}/   # Contenido de lecciones en Markdown
│   │   └── exercises/{en,es}/ # Definiciones de ejercicios (JSON)
│   ├── locales/            # Diccionarios i18n (en.ts, es.ts)
│   ├── stores/             # Pinia: theme, locale, progress
│   ├── types/              # Interfaces TypeScript
│   ├── utils/              # Temas Monaco y lenguaje x86asm
│   └── views/              # HomeView, LessonView, BlogView, BlogPostView
├── server/                 # Backend Deno
│   ├── routes/compile.ts   # POST /api/compile
│   └── sandbox/            # assembly.ts, c.ts (compilar + ejecutar)
└── tools/
    ├── jwasm/              # Ensamblador JWasm
    └── tcc/                # Tiny C Compiler
```

### Añadir Contenido

**Lecciones** — crear un archivo markdown en `src/data/lessons/{lang}/{id}.md` con frontmatter (`title`, `lesson`).

**Ejercicios** — crear un archivo JSON en `src/data/exercises/{lang}/{id}.json` con un arreglo `exercises`. Tipos soportados: `multiple-choice`, `reorder-lines`, `code`.

**Blog** — agregar una entrada `{id}` al arreglo `posts` en `BlogView.vue`, añadir las claves `"blog.post.{id}.title"`, `"blog.post.{id}.desc"` y `"blog.post.{id}.body"` en ambos archivos de idioma. El cuerpo del post soporta markdown con bloques de código.

**Nuevo idioma** — agregar el código al arreglo `LOCALES` en `src/stores/locale.ts`, crear `src/locales/{lang}.ts`, y agregar los directorios `src/data/lessons/{lang}/` + `src/data/exercises/{lang}/` con contenido traducido.

### Notas de Arquitectura

- **Monaco Editor** para ejercicios de código y resaltado de sintaxis estático (con `colorize()`).
- **Temas CSS** mediante atributo `data-theme` en `<html>`; el tema de Monaco se sincroniza con `editor.setTheme()`.
- **i18n** mediante diccionarios `Record<string, string>` + store Pinia (sin vue-i18n).
- **Progreso** almacenado en localStorage y persistido entre sesiones.
