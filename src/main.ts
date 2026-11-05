import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n, { setLocale, type SupportedLocale } from './i18n'
import { useRegistryStore } from './stores/registryStore'

import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)

// Start loading the dashboard registry at startup so routing and the first
// view share one loaded instance. load() is async and idempotent; we kick it
// off here (not awaited) and the view awaits `loaded` before rendering.
useRegistryStore().load()

app.mount('#app')

// Restore saved locale after mount
const saved = localStorage.getItem('app-locale') as SupportedLocale | null
if (saved && saved !== 'de') {
  setLocale(saved)
}
