<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import * as monaco from "monaco-editor";
import { registerMonacoThemes } from "@/utils/monaco-themes";
import { registerAssemblyLanguage } from "@/utils/monaco-languages";
import { useThemeStore } from "@/stores/theme";
import { useLocaleStore } from "@/stores/locale";
import { compileAndRun } from "@/api/compiler";

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

const DEFAULT_CODE = `ideal
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
end start`;

const code = ref(DEFAULT_CODE);
const isRunning = ref(false);
const error = ref("");
const showDos = ref(true);
const themeStore = useThemeStore();
const locale = useLocaleStore();

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
      language: "x86asm",
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
  }
});

onUnmounted(() => {
  editor?.dispose();
  dosProps?.stop().catch(() => {});
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
  if (!dosContainer.value) return;

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
      window as unknown as { Dos: (el: HTMLElement, opts: Record<string, unknown>) => unknown }
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

function reset() {
  code.value = DEFAULT_CODE;
  editor?.setValue(DEFAULT_CODE);
  error.value = "";
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
      <div class="toolbar-actions">
        <button @click="run" :disabled="isRunning" class="btn btn-run">
          {{ isRunning ? locale.t("exercise.code.running") : "▶ " + locale.t("exercise.code.run") }}
        </button>
        <button @click="reset" class="btn btn-reset">{{ locale.t("exercise.code.reset") }}</button>
        <button
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
      <div class="panel panel-dos" v-show="showDos">
        <div ref="dosContainer" class="dos-output" />
        <div v-if="error" class="error-panel">
          <pre>{{ error }}</pre>
        </div>
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
  border-color: var(--color-theme-accent);
  font-weight: 600;
}
.btn-run:hover {
  filter: brightness(1.1);
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
