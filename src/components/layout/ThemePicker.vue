<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const store = useThemeStore()
const open = ref(false)
const selectorRef = ref<HTMLElement>()

const currentTheme = computed(() => {
  const found = store.themes.find(t => t.id === store.theme)
  return found!
})

function toggle() {
  open.value = !open.value
}

function select(id: string) {
  store.applyTheme(id)
  open.value = false
}

function onDocumentClick(e: MouseEvent) {
  if (selectorRef.value && !selectorRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="selectorRef" class="theme-selector">
    <button class="theme-trigger" :class="{ open }" @click="toggle" :aria-label="currentTheme.name">
      <span class="trigger-swatch" :style="{ background: currentTheme.gradient }" />
      <span class="trigger-name">{{ currentTheme.name }}</span>
      <span class="trigger-arrow" :class="{ up: open }">▼</span>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="theme-dropdown">
        <button
          v-for="t in store.themes"
          :key="t.id"
          :class="['theme-option', { active: store.theme === t.id }]"
          @click="select(t.id)"
        >
          <span class="option-swatch" :style="{ background: t.gradient }" />
          <span class="option-name">{{ t.name }}</span>
          <span v-if="store.theme === t.id" class="option-check">✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.theme-selector {
  position: relative;
  user-select: none;
}

.theme-trigger {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-soft);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.8rem;
  font-family: inherit;
  white-space: nowrap;
  transition: border-color 0.15s;
}
.theme-trigger:hover {
  border-color: var(--color-border-hover);
}

.trigger-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.trigger-name {
  line-height: 1;
}

.trigger-arrow {
  font-size: 0.55rem;
  transition: transform 0.2s;
  line-height: 1;
  opacity: 0.7;
}
.trigger-arrow.up {
  transform: rotate(180deg);
}

/* Dropdown panel */
.theme-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 200px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4px;
  z-index: 200;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  max-height: 360px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .theme-selector {
    width: 100%;
  }
  .theme-trigger {
    width: 100%;
    justify-content: center;
  }
  .theme-dropdown {
    left: 50%;
    transform: translateX(-50%);
    right: auto;
    width: min(320px, calc(100vw - 3rem));
  }
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.82rem;
  font-family: inherit;
  text-align: left;
  transition: background 0.12s;
}
.theme-option:hover {
  background: var(--color-border-hover);
}
.theme-option.active {
  font-weight: 600;
  background: var(--color-bg-mute);
}

.option-swatch {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.option-name {
  flex: 1;
}

.option-check {
  font-size: 0.75rem;
  opacity: 0.8;
  flex-shrink: 0;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
