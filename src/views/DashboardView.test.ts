// @vitest-environment jsdom
//
// Component tests for DashboardView.vue (dashboard-registry Task 5.3).
//
// Covers the "Component (DashboardView)" bullet of the design Testing Strategy:
//   - iframe src carries the resolved uuid + ?standalone=2&show_filters=1 (Req 3.1)
//   - a locale switch swaps the uuid (Req 3.2)
//   - an unknown route name renders the NotFound state, no iframe (Req 2.3)
//   - the root path resolves the registry default entry (Req 2.4)
//
// The registry fetch is stubbed via global `fetch` so no real network/file
// access happens; the registry store loads this fixture in onMounted.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { createI18n } from 'vue-i18n'

import DashboardView from './DashboardView.vue'
import de from '../locales/de.json'
import fr from '../locales/fr.json'
import { useLanguageStore } from '../stores/languageStore'

// --- Fixtures ----------------------------------------------------------------

const BIOGAS_DE = 'fee0b314-e046-4202-a669-ec3d90e13207'
const BIOGAS_FR = '2e76e561-399e-4ea3-94d8-5e9ab9da0d1a'

const REGISTRY = {
  default: 'biogas',
  dashboards: [
    {
      name: 'biogas',
      uuid: {
        de: BIOGAS_DE,
        fr: BIOGAS_FR,
        it: 'bc758d58-1669-417f-ba1f-b7674a4f38d1',
        en: '9d1f27ee-4a4a-42f1-9b02-d65f182cbca1',
      },
    },
  ],
}

const SUFFIX = '?standalone=2&show_filters=1'

// --- Test harness ------------------------------------------------------------

// Stub global fetch so registryStore.load() receives our fixture synchronously.
function stubRegistryFetch(registry: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => registry,
    })),
  )
}

// Build a fresh router with the app's two routes (root + dynamic slug).
function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'root', component: DashboardView },
      { path: '/:name', name: 'dashboard', component: DashboardView, props: true },
    ],
  })
}

// Build an i18n instance with de + fr messages so locale switching is observable.
function makeI18n() {
  return createI18n({
    legacy: false,
    locale: 'de',
    fallbackLocale: 'de',
    messages: { de, fr },
  })
}

// Mount DashboardView at the given path with fresh pinia/i18n/router,
// stubbing the asset-importing shell components so they don't break mounting.
async function mountAt(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = makeRouter()
  const i18n = makeI18n()

  router.push(path)
  await router.isReady()

  const wrapper = mount(DashboardView, {
    global: {
      plugins: [pinia, router, i18n],
      stubs: {
        AppHeader: true,
        AppFooter: true,
      },
    },
  })

  // onMounted awaits registryStore.load(); let it resolve before asserting.
  await flushPromises()
  return { wrapper, router, pinia }
}

beforeEach(() => {
  stubRegistryFetch(REGISTRY)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// --- Tests -------------------------------------------------------------------

describe('DashboardView', () => {
  it('embeds the de UUID with the standalone suffix for /biogas at locale de (Req 3.1)', async () => {
    const { wrapper } = await mountAt('/biogas')

    const iframe = wrapper.find('iframe.dashboard-iframe')
    expect(iframe.exists()).toBe(true)

    const src = iframe.attributes('src') ?? ''
    expect(src).toContain(BIOGAS_DE)
    expect(src).toContain(SUFFIX)
    expect(src).toBe(
      `http://localhost:8088/superset/dashboard/${BIOGAS_DE}/${SUFFIX}`,
    )
  })

  it('swaps the iframe src to the fr UUID when the locale switches de -> fr (Req 3.2)', async () => {
    const { wrapper } = await mountAt('/biogas')

    const before = wrapper.find('iframe.dashboard-iframe').attributes('src') ?? ''
    expect(before).toContain(BIOGAS_DE)

    const languageStore = useLanguageStore()
    languageStore.currentLocale = 'fr'
    await flushPromises()

    const after = wrapper.find('iframe.dashboard-iframe').attributes('src') ?? ''
    expect(after).toContain(BIOGAS_FR)
    expect(after).not.toContain(BIOGAS_DE)
    expect(after).toContain(SUFFIX)
  })

  it('renders the NotFound state with no iframe for an unknown route name (Req 2.3)', async () => {
    const { wrapper } = await mountAt('/nope')

    expect(wrapper.find('iframe.dashboard-iframe').exists()).toBe(false)
    const notFound = wrapper.find('.dashboard-notfound')
    expect(notFound.exists()).toBe(true)
    expect(notFound.text()).toContain(de.dashboard_not_found)
  })

  it('resolves the registry default entry for the root path / (Req 2.4)', async () => {
    const { wrapper } = await mountAt('/')

    const iframe = wrapper.find('iframe.dashboard-iframe')
    expect(iframe.exists()).toBe(true)
    // `default: "biogas"` -> the biogas de UUID at the default locale.
    expect(iframe.attributes('src') ?? '').toContain(BIOGAS_DE)
  })
})
