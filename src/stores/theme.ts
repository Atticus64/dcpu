import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ThemeInfo {
  id: string
  name: string
  type: 'dark' | 'light'
  gradient: string
}

const THEMES: ThemeInfo[] = [
  { id: 'one-dark',        name: 'One Dark',        type: 'dark',  gradient: 'linear-gradient(135deg, #282c34, #61afef)' },
  { id: 'catppuccin-latte',  name: 'Catppuccin Latte', type: 'light', gradient: 'linear-gradient(135deg, #eff1f5, #8839ef)' },
  { id: 'catppuccin-mocha',  name: 'Catppuccin Mocha', type: 'dark',  gradient: 'linear-gradient(135deg, #1e1e2e, #cba6f7)' },
  { id: 'nord',             name: 'Nord',             type: 'dark',  gradient: 'linear-gradient(135deg, #2e3440, #88c0d0)' },
  { id: 'github-light',     name: 'GitHub Light',    type: 'light', gradient: 'linear-gradient(135deg, #ffffff, #0969da)' },
  { id: 'github-dark',      name: 'GitHub Dark',     type: 'dark',  gradient: 'linear-gradient(135deg, #0d1117, #58a6ff)' },
  { id: 'dracula',          name: 'Dracula',          type: 'dark',  gradient: 'linear-gradient(135deg, #282a36, #bd93f9)' },
  { id: 'tokyo-night',      name: 'Tokyo Night',      type: 'dark',  gradient: 'linear-gradient(135deg, #1a1b26, #7aa2f7)' },
  { id: 'gruvbox-dark',     name: 'Gruvbox Dark',    type: 'dark',  gradient: 'linear-gradient(135deg, #282828, #fe8019)' },
  { id: 'solarized-dark',   name: 'Solarized Dark',  type: 'dark',  gradient: 'linear-gradient(135deg, #002b36, #268bd2)' },
  { id: 'material-dark',    name: 'Material Dark',   type: 'dark',  gradient: 'linear-gradient(135deg, #263238, #82b1ff)' },
  { id: 'ayu-mirage',       name: 'Ayu Mirage',      type: 'dark',  gradient: 'linear-gradient(135deg, #1f2430, #73d0ff)' },
]

const DEFAULT_THEME = 'one-dark'
const STORAGE_KEY = 'dcpu-theme'

export function getPreferredTheme(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && THEMES.some(t => t.id === stored)) return stored
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    const light = THEMES.find(t => t.type === 'light')
    if (light) return light.id
  }
  return DEFAULT_THEME
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(getPreferredTheme())

  function applyTheme(id: string) {
    theme.value = id
    document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  function init() {
    applyTheme(theme.value)
  }

  return { theme, themes: THEMES, applyTheme, init }
})
