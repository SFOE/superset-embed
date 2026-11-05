<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLanguageStore } from '../stores/languageStore'
import { useRegistryStore } from '../stores/registryStore'
import { resolveUuid, type Locale, type RegistryEntry } from '../registry'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'

const { t } = useI18n()
const route = useRoute()
const languageStore = useLanguageStore()
const registryStore = useRegistryStore()
const iframeLoaded = ref(false)

// Height reported by Superset (superset_blueprint.py height-reporter) so the
// iframe grows to fit its content -> no confusing inner scrollbar.
const iframeHeight = ref(1700)

const supersetBase = import.meta.env.VITE_SUPERSET_URL || 'http://localhost:8088'

// The Registry_Entry resolved from the current route slug (or the default for
// the root path). null when no entry matches -> empty URL -> no iframe (the
// NotFound UI is added in Task 5.2).
const entry = ref<RegistryEntry | null>(null)

// Resolve the entry for the active route. `route.params.name` is undefined/empty
// for the root path, in which case we fall back to the registry default.
function resolveEntry() {
  const slug = route.params.name
  if (typeof slug === 'string' && slug.length > 0) {
    entry.value = registryStore.find(slug)
  } else {
    entry.value = registryStore.getDefault()
  }
}

function onMessage(e: MessageEvent) {
  const d = e.data
  if (d && d.type === 'dashboard-height' && typeof d.height === 'number' && d.height > 200) {
    iframeHeight.value = d.height
  }
}

onMounted(async () => {
  window.addEventListener('message', onMessage)
  // Ensure the shared registry is loaded (idempotent) before resolving.
  await registryStore.load()
  const lang = route.query.lang as string
  if (lang && ['de', 'fr', 'it', 'en'].includes(lang)) {
    languageStore.currentLocale = lang as 'de' | 'fr' | 'it' | 'en'
  }
  resolveEntry()
})

onUnmounted(() => window.removeEventListener('message', onMessage))

watch(() => route.query.lang, (lang) => {
  if (lang && typeof lang === 'string' && ['de', 'fr', 'it', 'en'].includes(lang)) {
    languageStore.currentLocale = lang as 'de' | 'fr' | 'it' | 'en'
  }
})

// Re-resolve + re-embed when the route slug changes (SPA navigation).
watch(() => route.params.name, () => {
  resolveEntry()
  iframeLoaded.value = false
})

const dashboardUrl = computed(() => {
  if (!entry.value) return ''
  const uuid = resolveUuid(entry.value, languageStore.currentLocale as Locale)
  if (!uuid) return ''
  return `${supersetBase}/superset/dashboard/${uuid}/?standalone=2&show_filters=1`
})

// Re-embed (iframe :key on the URL forces reload) and show the spinner again
// when the active locale changes.
watch(() => languageStore.currentLocale, () => {
  iframeLoaded.value = false
})

// No entry resolved, or the resolved entry has no usable UUID -> render the
// inline "dashboard not found" state instead of an empty iframe area (Req 2.3, 3.3).
const notFound = computed(() => dashboardUrl.value === '')

// Names of the registered dashboards, listed as links in the NotFound state.
const availableNames = computed(() =>
  registryStore.registry.dashboards.map((d) => d.name),
)
</script>

<template>
  <AppHeader />

  <main class="dashboard-main">
    <section class="dashboard-hero">
      <div class="app-container">
        <h1 class="hero-title">{{ t('dashboard_heading') }}</h1>
        <p class="hero-text">{{ t('dashboard_subheading') }}</p>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="app-container">
        <div class="dashboard-card">
          <div v-if="notFound" class="dashboard-notfound">
            <p class="notfound-title">{{ t('dashboard_not_found') }}</p>
            <template v-if="availableNames.length > 0">
              <p class="notfound-subtitle">{{ t('dashboard_available') }}</p>
              <ul class="notfound-list">
                <li v-for="name in availableNames" :key="name">
                  <RouterLink :to="'/' + name">{{ name }}</RouterLink>
                </li>
              </ul>
            </template>
          </div>
          <template v-else>
            <div v-if="!iframeLoaded" class="dashboard-loading">
              <div class="loading-spinner" aria-hidden="true"></div>
              <span>{{ t('loading') }}</span>
            </div>
            <iframe
              :key="dashboardUrl"
              :src="dashboardUrl"
              class="dashboard-iframe"
              :class="{ visible: iframeLoaded }"
              :style="{ height: iframeHeight + 'px' }"
              title="BFE Geodata Dashboard"
              frameborder="0"
              @load="iframeLoaded = true"
            ></iframe>
          </template>
        </div>
      </div>
    </section>
  </main>

  <AppFooter />
</template>

<style scoped>
.dashboard-main {
  background: #ffffff;
}

/* --- Hero --- */
.dashboard-hero {
  background: var(--color-primary);
  color: #fff;
  padding: 36px 0 30px;
}
.hero-title {
  font-size: 1.8rem;
  font-weight: 500;
  margin: 0 0 10px;
}
.hero-text {
  font-size: 1rem;
  line-height: 1.6;
  max-width: 760px;
  margin: 0;
  opacity: 0.9;
}

/* --- Dashboard card: square corners (admin.ch), no inner scroll --- */
.dashboard-section {
  padding: 32px 0 48px;
}
.dashboard-card {
  position: relative;
  background: #fff;
  /* no border, no radius, no shadow -- flat admin.ch look */
}

.dashboard-iframe {
  width: 100%;
  border: none;
  display: block;
  opacity: 0;
  transition: opacity 0.3s ease;
  /* height is set dynamically from the Superset height-reporter */
}
.dashboard-iframe.visible {
  opacity: 1;
}

.dashboard-loading {
  position: absolute;
  inset: 0;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-muted);
  font-size: 0.95rem;
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-separator);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* --- Dashboard not found: flat admin.ch message, square corners --- */
.dashboard-notfound {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--color-muted);
  font-size: 0.95rem;
}
.notfound-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--color-primary);
}
.notfound-subtitle {
  margin: 8px 0 0;
}
.notfound-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.notfound-list a {
  color: var(--color-primary);
  text-decoration: none;
}
.notfound-list a:hover {
  text-decoration: underline;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .hero-title { font-size: 1.4rem; }
}
</style>




