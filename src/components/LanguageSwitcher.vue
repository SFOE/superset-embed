<script setup lang="ts">
import { useLanguageStore } from '../stores/languageStore'

const languageStore = useLanguageStore()
const languages = { de: 'DE', fr: 'FR', it: 'IT', en: 'EN' }
</script>

<template>
  <div class="lang-switcher">
    <label for="lang-select" class="sr-only">Language</label>
    <select
      id="lang-select"
      v-model="languageStore.currentLocale"
      class="lang-select"
    >
      <option v-for="(label, code) in languages" :key="code" :value="code">
        {{ label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.lang-switcher {
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

.lang-select {
  appearance: none;
  -webkit-appearance: none;
  background: transparent
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23fff' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")
    no-repeat right 8px center;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.8125rem;
  padding: 4px 28px 4px 10px;
  cursor: pointer;
  min-width: 60px;
}
.lang-select:focus {
  outline: 2px solid rgba(255, 255, 255, 0.6);
  outline-offset: 1px;
}
.lang-select option {
  color: var(--color-text);
  background: #fff;
}
</style>
