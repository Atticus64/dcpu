<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    initialX?: number;
    initialY?: number;
    initialW?: number;
    initialH?: number;
    minW?: number;
    minH?: number;
    zIndex?: number;
  }>(),
  {
    title: "Output",
    initialX: 80,
    initialY: 80,
    initialW: 560,
    initialH: 400,
    minW: 360,
    minH: 220,
    zIndex: 1000,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
}>();

const x = ref(props.initialX);
const y = ref(props.initialY);
const w = ref(props.initialW);
const h = ref(props.initialH);
const minimized = ref(false);
const maximized = ref(false);
const isDragging = ref(false);
const isResizing = ref(false);
let dragStart = { x: 0, y: 0, ox: 0, oy: 0 };
let resizeStart = { x: 0, y: 0, w: 0, h: 0, dir: "" };
let prevRect = { x: 0, y: 0, w: 0, h: 0 };

const z = ref(props.zIndex);

function bringToFront() {
  // simple increment, parent can manage global counter if needed
  z.value = Date.now() % 100000;
}

const style = computed(() => {
  if (maximized.value) {
    return {
      left: "8px",
      top: "8px",
      width: "calc(100vw - 16px)",
      height: "calc(100vh - 16px)",
      zIndex: String(z.value),
    } as Record<string, string>;
  }
  return {
    left: `${x.value}px`,
    top: `${y.value}px`,
    width: `${w.value}px`,
    height: minimized.value ? "auto" : `${h.value}px`,
    zIndex: String(z.value),
  } as Record<string, string>;
});

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function onHeaderDown(e: MouseEvent | TouchEvent) {
  if (maximized.value) return;
  const isTouch = "touches" in e;
  const cx = isTouch ? (e as TouchEvent).touches[0]!.clientX : (e as MouseEvent).clientX;
  const cy = isTouch ? (e as TouchEvent).touches[0]!.clientY : (e as MouseEvent).clientY;
  isDragging.value = true;
  dragStart = { x: cx, y: cy, ox: x.value, oy: y.value };
  document.body.style.userSelect = "none";
  document.body.style.cursor = "grabbing";
  const onMove = (ev: MouseEvent | TouchEvent) => {
    const ccx = "touches" in ev ? (ev as TouchEvent).touches[0]!.clientX : (ev as MouseEvent).clientX;
    const ccy = "touches" in ev ? (ev as TouchEvent).touches[0]!.clientY : (ev as MouseEvent).clientY;
    const dx = ccx - dragStart.x;
    const dy = ccy - dragStart.y;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    x.value = clamp(dragStart.ox + dx, 0, vw - 80);
    y.value = clamp(dragStart.oy + dy, 0, vh - 40);
  };
  const onUp = () => {
    isDragging.value = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onMove as EventListener);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("touchmove", onMove as EventListener);
    window.removeEventListener("touchend", onUp);
  };
  window.addEventListener("mousemove", onMove as EventListener);
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchmove", onMove as EventListener, { passive: false } as AddEventListenerOptions);
  window.addEventListener("touchend", onUp);
  bringToFront();
}

function onResizeDown(e: MouseEvent, dir: string) {
  if (maximized.value || minimized.value) return;
  e.preventDefault();
  e.stopPropagation();
  const cx = e.clientX;
  const cy = e.clientY;
  isResizing.value = true;
  resizeStart = { x: cx, y: cy, w: w.value, h: h.value, dir };
  const startX = x.value;
  const startY = y.value;
  const onMove = (ev: MouseEvent) => {
    const dx = ev.clientX - resizeStart.x;
    const dy = ev.clientY - resizeStart.y;
    if (dir.includes("e")) w.value = Math.max(props.minW, resizeStart.w + dx);
    if (dir.includes("s")) h.value = Math.max(props.minH, resizeStart.h + dy);
    if (dir.includes("w")) {
      const nw = Math.max(props.minW, resizeStart.w - dx);
      x.value = startX + (resizeStart.w - nw);
      w.value = nw;
    }
    if (dir.includes("n")) {
      const nh = Math.max(props.minH, resizeStart.h - dy);
      y.value = startY + (resizeStart.h - nh);
      h.value = nh;
    }
  };
  const onUp = () => {
    isResizing.value = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function toggleMaximize() {
  if (maximized.value) {
    maximized.value = false;
    x.value = prevRect.x;
    y.value = prevRect.y;
    w.value = prevRect.w;
    h.value = prevRect.h;
  } else {
    prevRect = { x: x.value, y: y.value, w: w.value, h: h.value };
    maximized.value = true;
    minimized.value = false;
  }
}

function close() {
  emit("update:modelValue", false);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.modelValue) close();
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) bringToFront();
  },
);

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="floating-window"
      :class="{ dragging: isDragging, resizing: isResizing, minimized }"
      :style="style"
      role="dialog"
      aria-modal="false"
      @mousedown="bringToFront"
    >
      <div class="fw-header" @mousedown="onHeaderDown" @touchstart.prevent="onHeaderDown">
        <span class="fw-title">{{ title }}</span>
        <div class="fw-actions">
          <button class="fw-btn" :title="minimized ? 'Expand' : 'Minimize'" @click="minimized = !minimized">
            {{ minimized ? "▢" : "—" }}
          </button>
          <button class="fw-btn" :title="maximized ? 'Restore' : 'Maximize'" @click="toggleMaximize">
            {{ maximized ? "❐" : "□" }}
          </button>
          <button class="fw-btn fw-close" title="Close" @click="close">×</button>
        </div>
      </div>

      <div v-show="!minimized" class="fw-body">
        <slot />
      </div>

      <!-- resize handles -->
      <template v-if="!maximized && !minimized">
        <div class="fw-handle fw-handle-n" @mousedown="onResizeDown($event, 'n')" />
        <div class="fw-handle fw-handle-s" @mousedown="onResizeDown($event, 's')" />
        <div class="fw-handle fw-handle-e" @mousedown="onResizeDown($event, 'e')" />
        <div class="fw-handle fw-handle-w" @mousedown="onResizeDown($event, 'w')" />
        <div class="fw-handle fw-handle-ne" @mousedown="onResizeDown($event, 'ne')" />
        <div class="fw-handle fw-handle-nw" @mousedown="onResizeDown($event, 'nw')" />
        <div class="fw-handle fw-handle-se" @mousedown="onResizeDown($event, 'se')" />
        <div class="fw-handle fw-handle-sw" @mousedown="onResizeDown($event, 'sw')" />
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.floating-window {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-soft, #1e1e2e);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 10px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  backdrop-filter: blur(8px);
  user-select: none;
}
.floating-window.dragging,
.floating-window.resizing {
  user-select: none;
}

.fw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem 0.5rem 0.9rem;
  background: var(--color-bg, #0b0e14);
  border-bottom: 1px solid var(--color-border, #1f2630);
  cursor: grab;
  flex-shrink: 0;
}
.fw-header:active {
  cursor: grabbing;
}
.fw-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-heading, #e6e6e6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fw-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}
.fw-btn {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 6px;
  background: var(--color-bg-soft, #1e1e2e);
  color: var(--color-text, #d4d4d4);
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
}
.fw-btn:hover {
  background: var(--color-border-hover, #2a3340);
}
.fw-close:hover {
  background: #e53e3e;
  border-color: #e53e3e;
  color: #fff;
}
.fw-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #0b0e14;
}
.fw-body :deep(.asm-terminal),
.fw-body :deep(.c-terminal) {
  height: 100%;
  min-height: 0;
}

/* resize handles */
.fw-handle {
  position: absolute;
  background: transparent;
}
.fw-handle-n {
  top: 0;
  left: 6px;
  right: 6px;
  height: 4px;
  cursor: n-resize;
}
.fw-handle-s {
  bottom: 0;
  left: 6px;
  right: 6px;
  height: 6px;
  cursor: s-resize;
}
.fw-handle-e {
  top: 6px;
  bottom: 6px;
  right: 0;
  width: 6px;
  cursor: e-resize;
}
.fw-handle-w {
  top: 6px;
  bottom: 6px;
  left: 0;
  width: 6px;
  cursor: w-resize;
}
.fw-handle-ne {
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  cursor: ne-resize;
}
.fw-handle-nw {
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  cursor: nw-resize;
}
.fw-handle-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: se-resize;
}
.fw-handle-sw {
  bottom: 0;
  left: 0;
  width: 10px;
  height: 10px;
  cursor: sw-resize;
}
</style>
