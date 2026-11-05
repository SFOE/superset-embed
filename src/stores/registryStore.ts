import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadRegistry, findEntry, defaultEntry, type Registry, type RegistryEntry } from '../registry'

// Holds the loaded dashboard registry in one place so routing and the view
// share a single instance rather than each refetching /dashboards.json (Req 5.2).
export const useRegistryStore = defineStore('registry', () => {
  const registry = ref<Registry>({ dashboards: [] })
  const loaded = ref(false)

  // Fetch + sanitize the registry once. Idempotent: subsequent calls after a
  // successful load are no-ops and never refetch.
  async function load(): Promise<void> {
    if (loaded.value) {
      return
    }
    registry.value = await loadRegistry()
    loaded.value = true
  }

  function find(name: string): RegistryEntry | null {
    return findEntry(registry.value, name)
  }

  function getDefault(): RegistryEntry | null {
    return defaultEntry(registry.value)
  }

  return { registry, loaded, load, find, getDefault }
})
