<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRegistryStore } from '../stores/registryStore'

const route = useRoute()
const router = useRouter()
const registryStore = useRegistryStore()

// All published dashboard names, in registry order.
const names = computed(() => registryStore.registry.dashboards.map((d) => d.name))

// Only worth showing when there is more than one dashboard.
const show = computed(() => names.value.length > 1)

// The slug currently shown. On the root path, fall back to the default entry.
const current = computed(() => {
  const slug = route.params.name
  if (typeof slug === 'string' && slug.length > 0) return slug
  return registryStore.getDefault()?.name ?? ''
})

// Derive a readable label from a POSIX slug: "my-dashboard" -> "My dashboard".
function label(name: string): string {
  const spaced = name.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function onChange(event: Event) {
  const name = (event.target as HTMLSelectElement).value
  if (name && name !== route.params.name) {
    router.push('/' + name)
  }
}
</script>

<template>
  <div v-if="show" class="dash-switcher">
    <label for="dash-select" class="sr-only">Dashboard</label>
    <select id="dash-select" class="dash-select" :value="current" @change="onChange">
      <option v-for="name in names" :key="name" :value="name">
        {{ label(name) }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.dash-switcher {
  display: flex;
  align-items: center;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.dash-select {
  appearance: none;
  -webkit-appearance: none;
  background: #fff
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%232f4356' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")
    no-repeat right 8px center;
  border: 1px solid var(--color-border, #dcdcdc);
  border-radius: var(--radius-sm);
  color: var(--color-text, #2f4356);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 7px 30px 7px 12px;
  cursor: pointer;
  min-width: 160px;
}
.dash-select:focus {
  outline: 2px solid var(--color-primary, #2f4356);
  outline-offset: 1px;
}
.dash-select option {
  color: var(--color-text);
  background: #fff;
}
</style>

