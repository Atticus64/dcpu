import { defineStore } from 'pinia'
import { ref } from 'vue'
import { en } from '@/locales/en'
import { es } from '@/locales/es'

export interface LanguageInfo {
  code: string
  name: string
  flag: string
}

export const LOCALES: LanguageInfo[] = [
  { code: 'en', name: 'EN', flag: '🇺🇸' },
  { code: 'es', name: 'ES', flag: '🇪🇸' },
]

const dict: Record<string, Record<string, string>> = { en, es }

const STORAGE_KEY = 'dcpu-locale'

function detectLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && dict[stored]) return stored
  const nav = navigator.language.slice(0, 2)
  if (dict[nav]) return nav
  return 'en'
}

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref(detectLanguage())

  function setLocale(code: string) {
    if (!dict[code]) return
    locale.value = code
    localStorage.setItem(STORAGE_KEY, code)
  }

  function t(key: string): string {
    return dict[locale.value]?.[key] ?? dict['en']?.[key] ?? key
  }

  return { locale, locales: LOCALES, setLocale, t }
})
