<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import * as monaco from "monaco-editor";
import { registerMonacoThemes } from "@/utils/monaco-themes";
import { registerAssemblyLanguage } from "@/utils/monaco-languages";
import { useThemeStore } from "@/stores/theme";
import { useLocaleStore } from "@/stores/locale";
import CTerminal from "@/components/playground/CTerminal.vue";
import AsmTerminal from "@/components/playground/AsmTerminal.vue";
import FloatingWindow from "@/components/ui/FloatingWindow.vue";

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
  },
  {
    name: "Loop for square",
    code: `#include <stdio.h>

void ciclo1(int ancho) {
	for (int j = 0; j < ancho; j++) {
		printf("*");
	}
	printf("\\n");
}

void ciclo2(int ancho) {
	printf("*");
	for (int k = 0; k < ancho - 2; k++) {
		printf(" ");
	}
	printf("*");
	printf("\\n");
}

void imprimir_cuadrado(int ancho, int largo) {
  for (int i = 0; i < largo; i++) {
     if (i == 0 || i == largo - 1) {
       ciclo1(ancho);
     } else {
       ciclo2(ancho);
     }
  }
}

int main() {
  int ancho = 0, largo = 0;

  printf("Ingresa el ancho: ");
  fflush(stdout);
	scanf("%d", &ancho);
  printf("Ingresa el largo: ");
  fflush(stdout);
	scanf("%d", &largo);
    // ********** 10 x 3
    // *        *
    // **********
	imprimir_cuadrado(ancho, largo);

	return 0;
}
`
  }
]

const STORAGE_KEY = "dcpu-playground"

interface PlaygroundState {
  language: PlaygroundLanguage
  asmIndex: number
  cIndex: number
  dosZoom: number
  editorBasis: number
}

function clampZoom(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  if (!Number.isFinite(n)) return 1
  return Math.min(2, Math.max(1, Math.round(n * 4) / 4))
}

function clampBasis(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  if (!Number.isFinite(n)) return 50
  return Math.min(70, Math.max(30, Math.round(n)))
}

function loadState(): PlaygroundState {
  const fallback: PlaygroundState = { language: "assembly", asmIndex: 0, cIndex: 0, dosZoom: 1, editorBasis: 50 }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return fallback
  try {
    const parsed = JSON.parse(stored) as Partial<PlaygroundState>
    const language: PlaygroundLanguage =
      parsed.language === "c" || parsed.language === "assembly" ? parsed.language : "assembly"
    const asmIndex = clampIndex(parsed.asmIndex ?? 0, ASM_EXAMPLES.length)
    const cIndex = clampIndex(parsed.cIndex ?? 0, C_EXAMPLES.length)
    return {
      language,
      asmIndex,
      cIndex,
      dosZoom: clampZoom(parsed.dosZoom ?? 1),
      editorBasis: clampBasis(parsed.editorBasis ?? 50),
    }
  } catch {
    return fallback
  }
}

const FLOAT_KEY = "dcpu-floating"
function loadFloating(): boolean {
  try {
    const v = localStorage.getItem(FLOAT_KEY)
    if (v === "0") return false
    if (v === "1") return true
  } catch { /* ignore */ }
  return true
}
function saveFloating() {
  try { localStorage.setItem(FLOAT_KEY, preferFloating.value ? "1" : "0") } catch { /* ignore */ }
}

function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1)
}

function saveState() {
  const state: PlaygroundState = {
    language: language.value,
    asmIndex: selectedAsmExample.value,
    cIndex: selectedCExample.value,
    dosZoom: dosZoom.value,
    editorBasis: editorBasis.value,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const persisted = loadState()

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

// Zoom inline 100-200% (step 0.25) + splitter persisted
const dosZoom = ref(1)
const editorBasis = ref(50)
const panelsRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isMobile = ref(false)

const zoomPercent = computed(() => Math.round(dosZoom.value * 100))
const canZoomOut = computed(() => dosZoom.value > 1)
const canZoomIn = computed(() => dosZoom.value < 2)
const dosViewportStyle = computed(() => ({
  // Without overriding canvas !important, scale the container instead
  transform: `scale(${dosZoom.value})`,
  transformOrigin: "top center",
}))
const editorPanelStyle = computed(() =>
  showDos.value && language.value === "assembly" && !isMobile.value ? { flex: `0 0 ${editorBasis.value}%` } : undefined,
)
const dosPanelStyle = computed(() =>
  showDos.value && language.value === "assembly" && !isMobile.value ? { flex: `0 0 ${100 - editorBasis.value}%` } : undefined,
)

function zoomIn() {
  if (dosZoom.value < 2) dosZoom.value = clampZoom(dosZoom.value + 0.25)
}
function zoomOut() {
  if (dosZoom.value > 1) dosZoom.value = clampZoom(dosZoom.value - 0.25)
}
function resetZoom() {
  dosZoom.value = 1
}

let mediaQuery: MediaQueryList | null = null
let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null

function startDrag(e: MouseEvent | TouchEvent) {
  if (language.value !== "assembly" || !showDos.value) return
  const isTouch = "touches" in e
  const startX = isTouch ? (e as TouchEvent).touches[0]!.clientX : (e as MouseEvent).clientX
  const panelsEl = panelsRef.value
  if (!panelsEl) return
  const rect = panelsEl.getBoundingClientRect()
  const startBasis = editorBasis.value
  isDragging.value = true
  document.body.style.userSelect = "none"
  document.body.style.cursor = "col-resize"

  function onMove(ev: MouseEvent | TouchEvent) {
    const clientX = "touches" in ev ? (ev as TouchEvent).touches[0]!.clientX : (ev as MouseEvent).clientX
    const deltaX = clientX - startX
    const deltaPct = (deltaX / rect.width) * 100
    editorBasis.value = clampBasis(startBasis + deltaPct)
  }
  function onUp() {
    isDragging.value = false
    document.body.style.userSelect = ""
    document.body.style.cursor = ""
    window.removeEventListener("mousemove", onMove as EventListener)
    window.removeEventListener("mouseup", onUp)
    window.removeEventListener("touchmove", onMove as EventListener)
    window.removeEventListener("touchend", onUp)
    saveState()
  }
  window.addEventListener("mousemove", onMove as EventListener)
  window.addEventListener("mouseup", onUp)
  window.addEventListener("touchmove", onMove as EventListener, { passive: false } as AddEventListenerOptions)
  window.addEventListener("touchend", onUp)
}

const cTerminal = ref<InstanceType<typeof CTerminal> | null>(null)
const asmTerminal = ref<InstanceType<typeof AsmTerminal> | null>(null)
const cTerminalFloat = ref<InstanceType<typeof CTerminal> | null>(null)
const asmTerminalFloat = ref<InstanceType<typeof AsmTerminal> | null>(null)
const showAsmFloat = ref(false)
const showCFloat = ref(false)
const preferFloating = ref(true)

const editorContainer = ref<HTMLDivElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

onMounted(() => {
  language.value = persisted.language;
  selectedAsmExample.value = persisted.asmIndex;
  selectedCExample.value = persisted.cIndex;
  selectedExample.value = language.value === "c" ? persisted.cIndex : persisted.asmIndex;
  code.value = currentExamples()[selectedExample.value]!.code;
  dosZoom.value = clampZoom(persisted.dosZoom);
  editorBasis.value = clampBasis(persisted.editorBasis);
  preferFloating.value = loadFloating();
  mediaQuery = window.matchMedia("(max-width: 768px)")
  isMobile.value = mediaQuery.matches
  mediaHandler = (e: MediaQueryListEvent) => (isMobile.value = e.matches)
  mediaQuery.addEventListener("change", mediaHandler)

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
  cTerminal.value?.stop();
  asmTerminal.value?.stop();
  cTerminalFloat.value?.stop();
  asmTerminalFloat.value?.stop();
  if (mediaQuery && mediaHandler) mediaQuery.removeEventListener("change", mediaHandler);
});

watch(themeStore, () => {
  if (editor) {
    monaco.editor.setTheme(themeStore.theme);
  }
});

watch([language, selectedAsmExample, selectedCExample], saveState);
watch([dosZoom, editorBasis], saveState);
watch(preferFloating, saveFloating);

function activeAsmTerminal(): InstanceType<typeof AsmTerminal> | null {
  if (preferFloating.value) return asmTerminalFloat.value ?? asmTerminal.value;
  return asmTerminal.value ?? asmTerminalFloat.value;
}
function activeCTerminal(): InstanceType<typeof CTerminal> | null {
  if (preferFloating.value) return cTerminalFloat.value ?? cTerminal.value;
  return cTerminal.value ?? cTerminalFloat.value;
}

async function run() {
  if (language.value === "c") {
    if (!showDos.value) showDos.value = true;
    error.value = "";
    if (preferFloating.value) {
      showCFloat.value = true;
      await nextTick();
      activeCTerminal()?.start(code.value);
    } else {
      cTerminal.value?.start(code.value);
    }
    return;
  }
  // ASM: js-dos 100% cliente (compila via POST /api/compile/run -> exeBase64, ejecuta en AsmTerminal)
  if (!showDos.value) showDos.value = true;
  error.value = "";
  isRunning.value = true;
  if (preferFloating.value) {
    showAsmFloat.value = true;
    await nextTick();
    activeAsmTerminal()?.start(code.value);
  } else {
    asmTerminal.value?.start(code.value);
  }
  setTimeout(() => (isRunning.value = false), 800);
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
  cTerminal.value?.stop();
  asmTerminal.value?.stop();
  cTerminalFloat.value?.stop();
  asmTerminalFloat.value?.stop();
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
  if (!showDos.value) {
    asmTerminal.value?.stop();
    asmTerminalFloat.value?.stop();
  }
}
function toggleFloating() {
  preferFloating.value = !preferFloating.value;
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
        <button class="btn btn-dos-toggle" :title="preferFloating ? 'Modo dock' : 'Ventana flotante'" @click="toggleFloating">
          {{ preferFloating ? "⬗" : "🗔" }}
        </button>
        <button
          v-if="language === 'assembly' && !preferFloating"
          @click="toggleDos"
          class="btn btn-dos-toggle"
          :title="showDos ? 'Hide DOSBox' : 'Show DOSBox'"
        >
          {{ showDos ? "⊟" : "⊞" }}
        </button>
      </div>
    </div>

    <div ref="panelsRef" class="panels" :class="{ dragging: isDragging }">
      <div class="panel panel-editor" :style="preferFloating ? undefined : editorPanelStyle">
        <div ref="editorContainer" class="monaco-editor-container" />
      </div>
      <template v-if="!preferFloating">
        <div
          v-if="showDos && language === 'assembly'"
          class="splitter"
          role="separator"
          aria-orientation="vertical"
          :aria-valuenow="editorBasis"
          aria-valuemin="30"
          aria-valuemax="70"
          title="Arrastrar para redimensionar"
          @mousedown="startDrag"
          @touchstart.prevent="startDrag"
        />
        <div class="panel panel-dos" v-show="showDos && language === 'assembly'" :style="dosPanelStyle">
          <div class="dos-viewport" :style="dosViewportStyle">
            <AsmTerminal ref="asmTerminal" />
          </div>
          <div v-if="error" class="error-panel">
            <pre>{{ error }}</pre>
          </div>
        </div>
        <div class="panel panel-terminal" v-show="language === 'c'">
          <CTerminal ref="cTerminal" />
        </div>
      </template>
    </div>

    <!-- Floating windows (preferFloating) -->
    <FloatingWindow
      v-model="showAsmFloat"
      :title="locale.t('floating.asmTitle')"
      :initial-x="520"
      :initial-y="80"
      :initial-w="560"
      :initial-h="420"
      :z-index="1000"
      @update:model-value="(v) => !v && asmTerminalFloat?.stop()"
    >
      <AsmTerminal ref="asmTerminalFloat" />
    </FloatingWindow>

    <FloatingWindow
      v-model="showCFloat"
      :title="locale.t('floating.cTitle')"
      :initial-x="480"
      :initial-y="100"
      :initial-w="540"
      :initial-h="380"
      :z-index="1001"
      @update:model-value="(v) => !v && cTerminalFloat?.stop()"
    >
      <CTerminal ref="cTerminalFloat" />
    </FloatingWindow>
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
  gap: 0;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.panels.dragging {
  cursor: col-resize;
  user-select: none;
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
  overflow: hidden;
}

.splitter {
  flex: 0 0 8px;
  margin: 0 0.25rem;
  border-radius: 4px;
  background: transparent;
  cursor: col-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.splitter::after {
  content: "";
  width: 2px;
  height: 40px;
  border-radius: 999px;
  background: var(--color-border);
  transition: background 0.15s, height 0.15s;
}

.splitter:hover::after,
.panels.dragging .splitter::after {
  background: var(--color-theme-accent);
  height: 60px;
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

.panel-dos :deep(.asm-terminal) {
  height: 100%;
}

.dos-viewport {
  flex: 1;
  min-height: 300px;
  background: #000;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
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

  .splitter {
    display: none;
  }

  .dos-viewport {
    min-height: 320px;
  }

  .toolbar {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>
