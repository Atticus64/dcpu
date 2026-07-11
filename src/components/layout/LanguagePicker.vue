<script setup lang="ts">
import { useLocaleStore } from '@/stores/locale'

const store = useLocaleStore()
</script>

<template>
  <div class="lang-picker" title="Switch language">
    <button
      v-for="loc in store.locales"
      :key="loc.code"
      :class="['lang-btn', { active: store.locale === loc.code }]"
      @click="store.setLocale(loc.code)"
    >
      {{ loc.flag }} {{ loc.name }}
    </button>
  </div>
</template>

<style scoped>
.lang-picker {
  display: flex;
  gap: 4px;
}
.lang-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.lang-btn:hover {
  background: var(--color-border-hover);
}
.lang-btn.active {
  border-color: var(--color-heading);
  background: var(--color-border-hover);
}
</style>
