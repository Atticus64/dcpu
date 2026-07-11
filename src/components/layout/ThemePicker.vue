<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

const store = useThemeStore()
</script>

<template>
  <div class="theme-picker" title="Switch theme">
    <button
      v-for="t in store.themes"
      :key="t.id"
      :class="['theme-dot', { active: store.theme === t.id }]"
      :style="{ background: t.gradient }"
      :aria-label="t.name"
      :title="t.name"
      @click="store.applyTheme(t.id)"
    />
  </div>
</template>

<style scoped>
.theme-picker {
  display: flex;
  align-items: center;
  gap: 6px;
}
.theme-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  flex-shrink: 0;
  padding: 0;
  outline: none;
}
.theme-dot:hover {
  transform: scale(1.2);
}
.theme-dot.active {
  border-color: var(--color-heading);
  box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-heading);
}
</style>
