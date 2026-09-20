<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useLocaleStore } from "@/stores/locale";
import { useThemeStore } from "@/stores/theme";
import { compileAndRun } from "@/api/compiler";

type Status = "idle" | "connecting" | "running" | "exited" | "error";

interface TermLine {
  text: string;
  kind: "stderr" | "info";
}

const locale = useLocaleStore();
const themeStore = useThemeStore();

const status = ref<Status>("idle");
const lines = ref<TermLine[]>([]);
const exitCode = ref<number | null>(null);

let dosProps: { stop: () => Promise<void> } | null = null;

const dosContainer = ref<HTMLDivElement | null>(null);

// js-dos escucha el teclado en window, así que cortamos la propagación de teclas
// que no provienen de la pantalla DOS (p. ej. mientras se edita código en Monaco)
const activeDosContainers = new Set<HTMLElement>();

function isKeyTargetInDos(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Node)) return false;
  for (const el of activeDosContainers) {
    if (el.contains(target)) return true;
  }
  return false;
}

function keyboardGuard(e: KeyboardEvent) {
  if (activeDosContainers.size === 0) return;
  if (!isKeyTargetInDos(e.target)) {
    e.stopPropagation();
  }
}

onMounted(() => {
  document.addEventListener("keydown", keyboardGuard, false);
  document.addEventListener("keyup", keyboardGuard, false);
});

onUnmounted(() => {
  document.removeEventListener("keydown", keyboardGuard, false);
  document.removeEventListener("keyup", keyboardGuard, false);
});

const errors = computed(() => lines.value.filter((l) => l.kind === "stderr"));

const statusText = computed(() => {
  switch (status.value) {
    case "connecting":
      return locale.t("playground.terminal.connecting");
    case "running":
      return locale.t("playground.terminal.running");
    case "exited":
      return exitCode.value === 0
        ? locale.t("playground.terminal.finished")
        : locale.t("playground.terminal.exited").replace("{code}", String(exitCode.value));
    case "error":
      return locale.t("playground.terminal.error");
    default:
      return "";
  }
});

function resetState() {
  lines.value = [];
  exitCode.value = null;
}

async function stopDos() {
  if (dosProps) {
    try {
      await dosProps.stop();
    } catch {
      // ignore
    }
    dosProps = null;
  }
  if (dosContainer.value) {
    activeDosContainers.delete(dosContainer.value);
    dosContainer.value.innerHTML = "";
    dosContainer.value.removeAttribute("style");
  }
}

function stop() {
  void stopDos();
  resetState();
  status.value = "idle";
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function focusDosScreen() {
  const canvas = dosContainer.value?.querySelector("canvas") as HTMLElement | null;
  if (!canvas) return;
  canvas.tabIndex = 0;
  canvas.focus();
  if ("scrollIntoView" in canvas) {
    try {
      ((canvas as unknown) as { scrollIntoView?: () => void }).scrollIntoView?.();
    } catch {
      // ignore
    }
  }
}

function onEmuReady() {
  focusDosScreen();
}

async function start(code: string) {
  // js-dos 100% cliente: vista clásica visible e interactiva
  stop();
  resetState();
  status.value = "connecting";

  if (!dosContainer.value) {
    await nextTick();
    if (!dosContainer.value) {
      status.value = "error";
      lines.value.push({ text: "No se pudo montar el contenedor js-dos", kind: "stderr" });
      return;
    }
  }

  try {
    const res = await compileAndRun(code);
    if (!res.success || !res.exeBase64) {
      status.value = "error";
      lines.value.push({ text: res.error || "Compilation failed", kind: "stderr" });
      return;
    }

    const exeBytes = base64ToUint8Array(res.exeBase64);

    await import("js-dos/dist/js-dos.js");
    const Dos = (window as unknown as { Dos?: (el: HTMLElement, opts: Record<string, unknown>) => { stop: () => Promise<void> } }).Dos;
    if (!Dos) {
      status.value = "error";
      lines.value.push({ text: "No se pudo cargar js-dos", kind: "stderr" });
      return;
    }

    const isDark =
      themeStore.theme === "one-dark" ||
      themeStore.theme.endsWith("-dark") ||
      themeStore.theme.endsWith("-mirage") ||
      themeStore.theme === "dracula" ||
      themeStore.theme === "nord";

    const container = dosContainer.value;
    container.innerHTML = "";
    container.removeAttribute("style");

    // Sesión DOS clásica: el programa corre en vivo en pantalla y queda el prompt interactivo
    const dosboxConf = `[autoexec]\n@echo off\nmount c .\nc:\nprogram.exe\n`;

    dosProps = Dos(container, {
      pathPrefix: "/emulators/",
      initFs: [{ path: "program.exe", contents: exeBytes }],
      dosboxConf,
      autoStart: true,
      kiosk: true,
      noCursor: false,
      theme: isDark ? "dark" : "light",
      backend: "dosbox",
      backendLocked: true,
      workerThread: true,
      // máximo tamaño de fuente: el canvas estira a llenar todo el panel
      renderAspect: "Fit",
    });

    activeDosContainers.add(container);
    status.value = "running";

    container.addEventListener("emu-ready", onEmuReady, { once: true });
  } catch (err) {
    status.value = "error";
    lines.value.push({
      text: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      kind: "stderr",
    });
  }
}

defineExpose({ start, stop });
</script>

<template>
  <div class="asm-terminal">
    <div class="screen-wrap" @pointerdown="focusDosScreen" @click="focusDosScreen">
      <div ref="dosContainer" class="dos-screen" />
    </div>

    <div v-if="status === 'idle'" class="dos-message" aria-hidden="true">
      ▶ Presiona Run para ejecutar el programa
    </div>
    <div v-if="status === 'connecting'" class="dos-message" aria-hidden="true">
      {{ statusText }}…
    </div>

    <div v-if="errors.length" class="asm-errors">
      <pre v-for="(l, i) in errors" :key="i" class="asm-error-line">{{ l.text }}</pre>
    </div>

    <div v-if="status === 'running'" class="term-status" :class="status">
      <span>{{ statusText }}</span>
      <span class="dos-hint">Haz clic en la pantalla y escribe para interactuar</span>
    </div>
    <div v-else-if="status === 'error'" class="term-status" :class="status">
      {{ statusText }}
    </div>
  </div>
</template>

<style scoped>
.asm-terminal {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  background: #000;
  color: #d4d4d4;
  font-family: "Cascadia Mono", "JetBrains Mono", "Courier New", monospace;
}

.screen-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #000;
  overflow: hidden;
}

.dos-screen {
  position: absolute;
  inset: 0;
  background: #000;
}

.dos-screen :deep(.jsdos-rso),
.dos-screen :deep(.jsdos-rso .window),
.dos-screen :deep(.emulator-root) {
  width: 100%;
  height: 100%;
}

.dos-message {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6e7681;
  font-size: 0.9rem;
  pointer-events: none;
  z-index: 5;
  background: #000;
}

.asm-errors {
  position: absolute;
  inset: 0;
  background: rgba(11, 14, 20, 0.96);
  padding: 1.25rem;
  overflow: auto;
  z-index: 20;
}

.asm-error-line {
  margin: 0 0 0.35rem;
  color: #ff7b72;
  font-family: inherit;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.term-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  border-top: 1px solid #1f2630;
  color: #8b949e;
  background: #0f141f;
  flex-shrink: 0;
}

.term-status.running {
  color: #7fd1ff;
}

.term-status.error {
  color: #ff7b72;
}

.dos-hint {
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>