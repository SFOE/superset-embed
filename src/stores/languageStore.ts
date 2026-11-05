import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { setLocale, type SupportedLocale } from '../i18n'

const STORAGE_KEY = 'app-locale'

export const useLanguageStore = defineStore('language', () => {
  const saved = (localStorage.getItem(STORAGE_KEY) as SupportedLocale) || 'de'
  const currentLocale = ref<SupportedLocale>(saved)

  watch(currentLocale, async (locale) => {
    await setLocale(locale)
    localStorage.setItem(STORAGE_KEY, locale)
  })

  return { currentLocale }
})
