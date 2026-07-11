<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useLocaleStore } from '@/stores/locale'
import ThemePicker from './ThemePicker.vue'
import LanguagePicker from './LanguagePicker.vue'

const route = useRoute()
const locale = useLocaleStore()
const menuOpen = ref(false)

const links = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/lessons/01-hello-registers', labelKey: 'nav.lessons' },
  { path: '/blog', labelKey: 'nav.blog' },
]

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <RouterLink to="/" class="logo" @click="closeMenu">DCPU</RouterLink>

      <nav class="desktop-nav">
        <RouterLink
          v-for="link in links"
          :key="link.path"
          :to="link.path"
          :class="{ active: route.path === link.path }"
        >
          {{ locale.t(link.labelKey) }}
        </RouterLink>
      </nav>

      <div class="desktop-pickers">
        <ThemePicker />
        <LanguagePicker />
      </div>

      <button
        class="hamburger"
        :class="{ open: menuOpen }"
        @click="toggleMenu"
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <Transition name="fade">
      <div v-if="menuOpen" class="menu-overlay" @click="closeMenu" />
    </Transition>

    <Transition name="slide">
      <div v-if="menuOpen" class="mobile-menu">
        <nav class="mobile-nav">
          <RouterLink
            v-for="link in links"
            :key="link.path"
            :to="link.path"
            :class="{ active: route.path === link.path }"
            @click="closeMenu"
          >
            {{ locale.t(link.labelKey) }}
          </RouterLink>
        </nav>
        <hr>
        <div class="mobile-pickers">
          <ThemePicker />
          <LanguagePicker />
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  border-bottom: 1px solid var(--color-border);
  padding: 0 1.5rem;
}
.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 3.5rem;
}
.logo {
  font-weight: 700;
  font-size: 1.2rem;
  text-decoration: none;
  color: var(--color-heading);
}

/* Desktop nav & pickers */
.desktop-nav {
  display: flex;
  gap: 1rem;
}
.desktop-nav a {
  text-decoration: none;
  color: var(--color-text);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.15s;
}
.desktop-nav a:hover {
  background: var(--color-border-hover);
}
.desktop-nav a.active {
  color: var(--color-heading);
  font-weight: 600;
}
.desktop-pickers {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Hamburger button */
.hamburger {
  display: none;
  width: 24px;
  height: 20px;
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--color-text);
  position: absolute;
  left: 0;
  transition: all 0.25s;
}
.hamburger span:nth-child(1) { top: 0; }
.hamburger span:nth-child(2) { top: 9px; }
.hamburger span:nth-child(3) { top: 18px; }
.hamburger.open span:nth-child(1) {
  top: 9px;
  transform: rotate(45deg);
}
.hamburger.open span:nth-child(2) {
  opacity: 0;
}
.hamburger.open span:nth-child(3) {
  top: 9px;
  transform: rotate(-45deg);
}

/* Overlay */
.menu-overlay {
  position: fixed;
  inset: 0;
  top: 3.5rem;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
}

/* Mobile menu panel */
.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
  padding: 1rem 1.5rem;
}
.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.mobile-nav a {
  text-decoration: none;
  color: var(--color-text);
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  transition: background 0.15s;
  font-size: 1rem;
}
.mobile-nav a:hover {
  background: var(--color-border-hover);
}
.mobile-nav a.active {
  color: var(--color-heading);
  font-weight: 600;
  background: var(--color-background-mute);
}
.mobile-menu hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0.75rem 0;
}
.mobile-pickers {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s, opacity 0.2s;
}
.slide-enter-from {
  transform: translateY(-8px);
  opacity: 0;
}
.slide-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .desktop-nav,
  .desktop-pickers {
    display: none;
  }
  .hamburger {
    display: block;
  }
}
</style>
