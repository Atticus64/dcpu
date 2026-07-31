<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import * as monaco from "monaco-editor";
import { registerMonacoThemes } from "@/utils/monaco-themes";
import { registerAssemblyLanguage } from "@/utils/monaco-languages";
import { useThemeStore } from "@/stores/theme";
import { useLocaleStore } from "@/stores/locale";
import { compileAndRun } from "@/api/compiler";
import CTerminal from "@/components/playground/CTerminal.vue";

type PlaygroundLanguage = "assembly" | "c";

import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") return new JsonWorker();
    if (label === "css" || label === "scss" || label === "less") return new CssWorker();
    if (label === "html" || label === "handlebars" || label === "razor") return new HtmlWorker();
    if (label === "typescript" || label === "javascript") return new TsWorker();
    return new EditorWorker();
  },
};

const ASM_EXAMPLES = [
  {
    name: "Hello Tasm!",
    code: `ideal
model small
stack 100h

codeseg
start:
    mov ah, 02h
    mov dl, 'T'
    int 21h
    mov dl, 'a'
    int 21h
    mov dl, 's'
    int 21h
    mov dl, 'm'
    int 21h
    mov dl, '!'
    int 21h
    mov dl, 13
    int 21h
    mov dl, 10
    int 21h

    mov ax, 4C00h
    int 21h
end start`,
  },
  {
    name: "Simple Sum",
    code: `ideal
model small
stack 100h

codeseg
start:
    mov al, 5
    mov bl, 3
    add al, bl
    add al, '0'

    mov ah, 02h
    mov dl, al
    int 21h

    mov dl, 13
    int 21h
    mov dl, 10
    int 21h

    mov ax, 4C00h
    int 21h
end start`,
  },
  {
    name: "Spectacular Spider-Man",
    code: `ideal
model small
stack 100h

dataseg
spec db 'Spectacular ', 0
spid db 'Spider-Man!', 13, 10, 0

codeseg
proc aputs  ; PROCEDIMIENTO QUE IMPRIME UNA CADENA DE CARACTERES
    push ax
    push bx

    mov ah, 0Eh
    mov bh, 0

    cld

@@while:
    lodsb
    cmp al, 0
    je @@endwhi

    int 10h
    jmp @@while

@@endwhi:
    pop bx
    pop ax
    ret

endp aputs

proc getp
    push bx
    push cx

    mov ah, 03h
    int 10h

    pop cx
    pop bx
    ret
endp getp

proc asetp
    push bx
    push ax
    mov bh, 0
    mov ah, 2
    int 10h
    pop ax
    pop bx
    ret
endp asetp

proc aputsc
    push ax
    push bx
    push cx

    cld

@@while:
    lodsb
    cmp al, 0
    je @@endwhi

    cmp al, 13
    je @@ctrl
    cmp al, 10
    je @@ctrl

    jmp @@print

@@ctrl:
    mov ah, 0Eh
    mov bh, 0
    int 10h
    jmp @@while

@@print:
    mov ah, 09h
    mov bh, 0
    mov cx, 1
    int 10h
    call getp
    inc dl
    call asetp
    jmp @@while

@@endwhi:
    pop cx
    pop bx
    pop ax
    ret

endp aputsc

start:
    mov ax, @data
    mov ds, ax

    mov bl, 9
    mov si, offset spec
    call aputsc
    mov bl, 12
    mov si, offset spid
    call aputsc

    mov ax, 4C00h
    int 21h
end start`,
  },
]

const C_EXAMPLES = [
  {
    name: "Hello C!",
    code: `#include <stdio.h>

int main() {
    printf("Hello C!\\n");
    return 0;
}`,
  },
  {
    name: "Simple Sum",
    code: `#include <stdio.h>

int main() {
    int a = 5;
    int b = 3;
    printf("%d\\n", a + b);
    return 0;
}`,
  },
  {
    name: "Read a Number",
    code: `#include <stdio.h>

int main() {
    int n;
    printf("Enter a number: ");
    fflush(stdout);
    scanf("%d", &n);
    printf("\\n%d * 2 => %d\\n", n, n * 2);
    return 0;
}`,
  },
  {
    name: "Using struct",
    code: `#include <stdio.h>

struct User {
    int age;
    const char* name;
};

int main() {
    struct User pedro;
    pedro.name = "Pedro";
    pedro.age = 15;
    int future = 10;
    int n_edad = pedro.age + future;
    printf("%s ", pedro.name);
    printf("tiene %d años\\n", pedro.age);
    printf("Dentro de 10 años\\n");
    printf("%s tendra %d \\n", pedro.name, n_edad);
    return 0;
}`
  }
]

const code = ref(ASM_EXAMPLES[0]!.code)
const selectedExample = ref(0)
const selectedAsmExample = ref(0)
const selectedCExample = ref(0)
const language = ref<PlaygroundLanguage>("assembly")
const isRunning = ref(false);
const error = ref("");
const showDos = ref(true);
const themeStore = useThemeStore();
const locale = useLocaleStore();

const cTerminal = ref<InstanceType<typeof CTerminal> | null>(null)

const editorContainer = ref<HTMLDivElement | null>(null);
const dosContainer = ref<HTMLDivElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let dosProps: { stop: () => Promise<void> } | null = null;

onMounted(() => {
  registerAssemblyLanguage(monaco);
  registerMonacoThemes(monaco);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/js-dos.css";
  document.head.appendChild(link);

  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: code.value,
      language: editorLanguage(),
      theme: themeStore.theme,
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      scrollBeyondLastLine: false,
      renderLineHighlight: "line",
      lineNumbers: "on",
      tabSize: 2,
    });

    editor.onDidChangeModelContent(() => {
      code.value = editor!.getValue();
    });

    editor.onDidFocusEditorText(() => {
      if (showDos.value) {
        toggleDos();
      }
    });
  }
});

onUnmounted(() => {
  editor?.dispose();
  dosProps?.stop().catch(() => {});
  cTerminal.value?.stop();
});

watch(themeStore, () => {
  if (editor) {
    monaco.editor.setTheme(themeStore.theme);
  }
});

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function run() {
  if (language.value === "c") {
    cTerminal.value?.start(code.value);
    return;
  }
  runAssembly();
}

async function runAssembly() {
  if (!dosContainer.value) return;

  if (!showDos.value) showDos.value = true;

  isRunning.value = true;
  error.value = "";

  try {
    const res = await compileAndRun(code.value);
    if (!res.success || !res.exeBase64) {
      error.value = res.error || "Compilation failed";
      return;
    }

    const exeBytes = base64ToUint8Array(res.exeBase64);

    if (dosProps) {
      await dosProps.stop();
      dosProps = null;
    }

    dosContainer.value.innerHTML = "";

    await import("js-dos/dist/js-dos.js");
    const Dos = (
      window as unknown as { Dos: (el: HTMLElement, opts: Record<string, unknown>) => { stop: () => Promise<void> } }
    ).Dos;

    dosProps = Dos(dosContainer.value, {
      dosboxConf: `[autoexec]\n@echo off\ncls\nmount c .\nc:\nprogram.exe\n`,
      initFs: [{ path: "program.exe", contents: exeBytes }],
      pathPrefix: "/emulators/",
      autoStart: true,
      noCursor: false,
      kiosk: true,
      theme:
        themeStore.theme === "one-dark" ||
        themeStore.theme.endsWith("-dark") ||
        themeStore.theme.endsWith("-mirage") ||
        themeStore.theme === "dracula" ||
        themeStore.theme === "nord"
          ? "dark"
          : "light",
      backend: "dosbox",
      backendLocked: true,
      workerThread: true,
    });
  } catch (err) {
    error.value = `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  } finally {
    isRunning.value = false;
  }
}

function currentExamples() {
  return language.value === "c" ? C_EXAMPLES : ASM_EXAMPLES;
}

function loadExample(index: number) {
  if (language.value === "c") {
    selectedCExample.value = index;
  } else {
    selectedAsmExample.value = index;
  }
  selectedExample.value = index
  const ex = currentExamples()[index]!
  code.value = ex.code
  editor?.setValue(ex.code)
  error.value = ''
}

function editorLanguage() {
  return language.value === "c" ? "c" : "x86asm";
}

async function stopRunning() {
  if (dosProps) {
    await dosProps.stop().catch(() => {});
    dosProps = null;
  }
  cTerminal.value?.stop();
}

async function switchLanguage(lang: PlaygroundLanguage) {
  if (lang === language.value) return;
  language.value = lang;
  selectedExample.value = 0;
  if (lang === "c") selectedCExample.value = 0;
  else selectedAsmExample.value = 0;
  if (editor) {
    monaco.editor.setModelLanguage(editor.getModel()!, editorLanguage());
  }
  await stopRunning();
  error.value = "";
  loadExample(0);
}

function reset() {
  loadExample(0)
}

function toggleDos() {
  showDos.value = !showDos.value;
  if (!showDos.value && dosProps) {
    dosProps.stop().catch(() => {});
    dosProps = null;
  }
}
</script>

<template>
  <div class="playground">
    <div class="toolbar">
      <h2 class="title">{{ locale.t("playground.title") }}</h2>
      <div class="lang-toggle">
        <button
          :class="['lang-btn', { active: language === 'assembly' }]"
          @click="switchLanguage('assembly')"
        >
          {{ locale.t("playground.language.assembly") }}
        </button>
        <button
          :class="['lang-btn', { active: language === 'c' }]"
          @click="switchLanguage('c')"
        >
          {{ locale.t("playground.language.c") }}
        </button>
      </div>
      <select v-model="selectedExample" @change="loadExample(selectedExample)" class="example-select">
        <option v-for="(ex, i) in currentExamples()" :key="i" :value="i">{{ ex.name }}</option>
      </select>
      <div class="toolbar-actions">
        <button @click="run" :disabled="isRunning" class="btn btn-run">
          {{ isRunning ? locale.t("exercise.code.running") : "▶ " + locale.t("exercise.code.run") }}
        </button>
        <button @click="reset" class="btn btn-reset">{{ locale.t("exercise.code.reset") }}</button>
        <button
          v-if="language === 'assembly'"
          @click="toggleDos"
          class="btn btn-dos-toggle"
          :title="showDos ? 'Hide DOSBox' : 'Show DOSBox'"
        >
          {{ showDos ? "⊟" : "⊞" }}
        </button>
      </div>
    </div>

    <div class="panels">
      <div class="panel panel-editor">
        <div ref="editorContainer" class="monaco-editor-container" />
      </div>
      <div class="panel panel-dos" v-show="showDos && language === 'assembly'">
        <div ref="dosContainer" class="dos-output" />
        <div v-if="error" class="error-panel">
          <pre>{{ error }}</pre>
        </div>
      </div>
      <div class="panel panel-terminal" v-show="language === 'c'">
        <CTerminal ref="cTerminal" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  height: calc(100vh - 3.5rem - 3rem);
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.45rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.btn-run {
  background: var(--color-theme-accent);
  color: #fff;
  transition: color 0.2s;
  border-color: var(--color-theme-accent);
  font-weight: 600;
}
.btn-run:hover {
  /*filter: brightness(0.5);*/
  color: #000;
  background: var(--color-theme-accent);
}
.btn-run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset {
  background: var(--color-bg-soft);
  color: var(--color-text);
}
.btn-reset:hover {
  background: var(--color-border-hover);
}

.btn-dos-toggle {
  background: var(--color-bg-soft);
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1;
  padding: 0.45rem 0.6rem;
}
.btn-dos-toggle:hover {
  background: var(--color-border-hover);
}

.example-select {
  background: var(--color-bg-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  max-width: 200px;
}
.example-select:focus {
  outline: none;
  border-color: var(--color-theme-accent);
}

.lang-toggle {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.lang-btn {
  padding: 0.35rem 0.9rem;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--color-text);
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.lang-btn:hover {
  background: var(--color-border-hover);
}

.lang-btn.active {
  background: var(--color-theme-accent);
  color: #fff;
  font-weight: 600;
}

.panels {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-soft);
}

.panel-editor {
  flex: 1;
  min-width: 0;
}

.monaco-editor-container {
  height: 100%;
  min-height: 300px;
}

.panel-dos {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.panel-terminal {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.panel-terminal :deep(.c-terminal) {
  height: 100%;
}

.dos-output {
  flex: 1;
  min-height: 300px;
  background: #000;
  position: relative;
}

.dos-output :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
  object-position: top center;
}

.error-panel {
  position: absolute;
  inset: 0;
  background: var(--color-bg);
  padding: 1.5rem;
  overflow: auto;
}

.error-panel pre {
  margin: 0;
  color: var(--color-output-error);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .playground {
    padding: 1rem;
    height: auto;
    min-height: calc(100vh - 3.5rem);
  }

  .panels {
    flex-direction: column;
  }

  .panel-editor,
  .panel-dos {
    min-height: 350px;
  }

  .toolbar {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>
