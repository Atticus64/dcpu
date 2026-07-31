<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useLocaleStore } from "@/stores/locale";
import { startCSession, sendCSessionInput } from "@/api/c-session";

type Status = "idle" | "connecting" | "running" | "exited" | "error";

interface TermLine {
  text: string;
  kind: "output" | "input" | "stderr" | "info";
}

const locale = useLocaleStore();

const status = ref<Status>("idle");
const lines = ref<TermLine[]>([]);
const pending = ref("");
const inputText = ref("");
const exitCode = ref<number | null>(null);
const errorMsg = ref("");
let ws: WebSocket | null = null;

const outputEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);

const statusText = computed(() => {
  switch (status.value) {
    case "idle":
      return "";
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
const canInput = ref(false);

function flushPending() {
  if (pending.value) {
    lines.value.push({ text: pending.value, kind: "output" });
    pending.value = "";
  }
}

function appendData(data: string, kind: "output" | "stderr") {
  pending.value += data;
  const parts = pending.value.split("\n");
  pending.value = parts.pop() ?? "";
  for (const part of parts) {
    lines.value.push({ text: part, kind });
  }
  if (status.value === "exited") flushPending();
}

function resetState() {
  lines.value = [];
  pending.value = "";
  exitCode.value = null;
  errorMsg.value = "";
  canInput.value = false;
}

function stop() {
  if (ws) {
    ws.onopen = null;
    ws.onmessage = null;
    ws.onclose = null;
    ws.onerror = null;
    try {
      ws.close();
    } catch {
      // already closed
    }
    ws = null;
  }
  resetState();
  status.value = "idle";
}

function start(code: string) {
  stop();
  resetState();
  status.value = "connecting";

  ws = startCSession(code);

  ws.onmessage = (event: MessageEvent) => {
    let msg: { type: string; data?: string; stream?: string; code?: number; message?: string };
    try {
      msg = JSON.parse(String(event.data));
    } catch {
      return;
    }

    if (msg.type === "ready") {
      status.value = "running";
      canInput.value = true;
      nextTick(() => inputEl.value?.focus());
    } else if (msg.type === "output") {
      appendData(msg.data ?? "", msg.stream === "stderr" ? "stderr" : "output");
    } else if (msg.type === "exit") {
      exitCode.value = msg.code ?? 0;
      status.value = "exited";
      canInput.value = false;
      flushPending();
      lines.value.push({
        text: exitCode.value === 0
          ? locale.t("playground.terminal.finished")
          : locale.t("playground.terminal.exited").replace("{code}", String(exitCode.value)),
        kind: "info",
      });
    } else if (msg.type === "error") {
      errorMsg.value = msg.message ?? "Unknown error";
      status.value = "error";
      canInput.value = false;
      lines.value.push({ text: errorMsg.value, kind: "stderr" });
    }
  };

  ws.onclose = () => {
    if (status.value === "connecting") {
      status.value = "error";
      canInput.value = false;
      lines.value.push({ text: locale.t("playground.terminal.connectionFailed"), kind: "stderr" });
    }
    ws = null;
  };

  ws.onerror = () => {
    // onclose will fire
  };
}

function sendInput() {
  const text = inputText.value;
  if (!text || !ws || !canInput.value) return;
  sendCSessionInput(ws, text + "\n");
  if (pending.value) {
    pending.value += text;
  } else {
    lines.value.push({ text, kind: "input" });
  }
  inputText.value = "";
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendInput();
  }
}

watch(
  () => [lines.value.length, pending.value, status.value] as const,
  async () => {
    await nextTick();
    if (outputEl.value) {
      outputEl.value.scrollTop = outputEl.value.scrollHeight;
    }
  },
);

defineExpose({ start, stop });
</script>

<template>
  <div class="c-terminal">
    <div ref="outputEl" class="term-output">
      <template v-for="(line, i) in lines" :key="i">
        <div class="term-line" :class="line.kind">{{ line.text }}</div>
      </template>
      <span v-if="pending" class="term-line output">{{ pending }}<span class="term-cursor" /></span>
    </div>

    <div class="term-input-row">
      <span class="term-prompt">></span>
      <input
        ref="inputEl"
        v-model="inputText"
        class="term-input"
        :placeholder="canInput ? locale.t('playground.terminal.placeholder') : ''"
        :disabled="!canInput"
        @keydown="handleKeydown"
      />
    </div>

    <div v-if="status !== 'idle'" class="term-status" :class="status">
      {{ statusText }}
    </div>
  </div>
</template>

<style scoped>
.c-terminal {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  background: #0b0e14;
  color: #d4d4d4;
  font-family: "Cascadia Mono", "JetBrains Mono", "Courier New", monospace;
  font-size: 0.85rem;
}

.term-output {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.term-line {
  min-height: 1.2em;
  line-height: 1.45;
}

.term-line.input {
  color: #7fd1ff;
}

.term-line.stderr {
  color: #ff7b72;
}

.term-line.info {
  color: #8b949e;
  font-style: italic;
}

.term-cursor {
  display: inline-block;
  width: 8px;
  height: 1.1em;
  vertical-align: text-bottom;
  background: #d4d4d4;
  animation: term-blink 1s step-end infinite;
}

@keyframes term-blink {
  50% {
    opacity: 0;
  }
}

.term-input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid #1f2630;
}

.term-prompt {
  color: var(--color-theme-accent, #5ea9ff);
  font-weight: 700;
  user-select: none;
}

.term-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #d4d4d4;
  font-family: inherit;
  font-size: inherit;
}

.term-input::placeholder {
  color: #6e7681;
}

.term-input:disabled {
  cursor: not-allowed;
}

.term-status {
  padding: 0.35rem 1rem;
  font-size: 0.75rem;
  border-top: 1px solid #1f2630;
  color: #8b949e;
}

.term-status.running {
  color: #7fd1ff;
}

.term-status.error {
  color: #ff7b72;
}

.term-status.exited {
  color: #7ee787;
}
</style>
