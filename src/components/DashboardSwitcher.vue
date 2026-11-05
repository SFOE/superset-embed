<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRegistryStore } from '../stores/registryStore'

const route = useRoute()
const router = useRouter()
const registryStore = useRegistryStore()

const names = computed(() => registryStore.registry.dashboards.map((d) => d.name))
const show = computed(() => names.value.length > 1)

function label(name: string): string {
  const spaced = name.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

const current = computed(() => {
  const slug = route.params.name
  if (typeof slug === 'string' && slug.length > 0) return slug
  return registryStore.getDefault()?.name ?? ''
})

// --- searchable dropdown state ---
const open = ref(false)
const query = ref('')
const activeIndex = ref(0)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = names.value
  if (!q) return list
  return list.filter((n) => n.toLowerCase().includes(q) || label(n).toLowerCase().includes(q))
})

watch(open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    activeIndex.value = Math.max(0, filtered.value.indexOf(current.value))
  }
})
watch(filtered, () => {
  activeIndex.value = 0
})

function choose(name: string) {
  open.value = false
  if (name && name !== current.value) router.push('/' + name)
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value && (e.key === 'ArrowDown' || e.key === 'Enter')) {
    open.value = true
    return
  }
  if (!open.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const pick = filtered.value[activeIndex.value]
    if (pick) choose(pick)
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

function onBlur() {
  // close after a tick so option mousedown registers
  setTimeout(() => (open.value = false), 120)
}
</script>

<template>
  <div v-if="show" class="dash-switcher">
    <span class="dash-label">Dashboard</span>
    <div class="dash-combo">
      <input
        v-if="open"
        class="dash-input"
        type="text"
        :placeholder="label(current)"
        v-model="query"
        @keydown="onKeydown"
        @blur="onBlur"
        ref="inputEl"
        autofocus
      />
      <button
        v-else
        type="button"
        class="dash-trigger"
        @click="open = true"
        @keydown="onKeydown"
      >
        <span class="dash-current">{{ label(current) }}</span>
        <span class="dash-caret" aria-hidden="true">▾</span>
      </button>

      <ul v-if="open" class="dash-menu" role="listbox">
        <li v-if="filtered.length === 0" class="dash-empty">No match</li>
        <li
          v-for="(name, i) in filtered"
          :key="name"
          role="option"
          :aria-selected="name === current"
          class="dash-option"
          :class="{ active: i === activeIndex, selected: name === current }"
          @mousedown.prevent="choose(name)"
          @mouseenter="activeIndex = i"
        >
          {{ label(name) }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.dash-switcher {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dash-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.dash-combo {
  position: relative;
  min-width: 260px;
}
.dash-trigger,
.dash-input {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-primary);
  background: #fff;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  cursor: pointer;
  text-align: left;
}
.dash-input {
  font-weight: 500;
  outline: none;
}
.dash-trigger:hover {
  background: #f4f6f8;
}
.dash-trigger:focus,
.dash-input:focus {
  outline: 2px solid var(--color-link);
  outline-offset: 1px;
}
.dash-caret {
  color: var(--color-primary);
  font-size: 0.9rem;
}
.dash-menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: #fff;
  border: 1px solid var(--color-separator);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  max-height: 280px;
  overflow-y: auto;
}
.dash-option {
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  color: var(--color-text);
  cursor: pointer;
}
.dash-option.active {
  background: #eef2f5;
}
.dash-option.selected {
  color: var(--color-primary);
  font-weight: 600;
}
.dash-empty {
  padding: 9px 12px;
  color: var(--color-muted);
  font-size: 0.95rem;
}
</style>
