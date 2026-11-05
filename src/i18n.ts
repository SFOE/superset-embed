import { createI18n } from 'vue-i18n'
import de from './locales/de.json'

export type SupportedLocale = 'de' | 'fr' | 'it' | 'en'

const i18n = createI18n({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'de',
  messages: { de },
})

const loadedLocales = new Set<string>(['de'])

export async function setLocale(locale: SupportedLocale): Promise<void> {
  if (!loadedLocales.has(locale)) {
    const messages = await import(`./locales/${locale}.json`)
    i18n.global.setLocaleMessage(locale, messages.default)
    loadedLocales.add(locale)
  }
  ;(i18n.global.locale as unknown as { value: string }).value = locale
  document.documentElement.lang = locale
}

export default i18n
