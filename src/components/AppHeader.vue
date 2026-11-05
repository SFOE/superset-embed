<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './LanguageSwitcher.vue'
import swissLogo from '../assets/swiss-logo.svg'

const { t } = useI18n()
</script>

<template>
  <header class="full-bleed">
    <!-- Top bar: dark with nav + language switcher -->
    <div class="top-header-box">
      <div class="app-container top-header-inner top-header-inner--end">
        <LanguageSwitcher />
      </div>
    </div>

    <!-- Bottom bar: logo + title -->
    <div class="bottom-header-box">
      <div class="app-container bottom-header-inner">
        <img :src="swissLogo" alt="Swiss Confederation" class="header-logo" />
        <span class="header-divider" aria-hidden="true"></span>
        <h1 class="header-title">{{ t('header_title') }}</h1>
      </div>
    </div>

    <!-- Separator line -->
    <div class="header-line"></div>
  </header>
</template>

<style scoped>
.top-header-box {
  background: var(--color-primary);
  height: 50px;
}
.top-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.bottom-header-box {
  background: #fff;
}
.bottom-header-inner {
  display: flex;
  align-items: center;
  padding-top: 12px;
  padding-bottom: 12px;
  gap: 16px;
}

.header-logo {
  height: 52px;
  width: auto;
  flex-shrink: 0;
}

.header-divider {
  width: 1px;
  height: 40px;
  background: var(--color-separator);
  flex-shrink: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  color: var(--color-text);
  line-height: 1.3;
}

.header-line {
  height: 1px;
  background: var(--color-separator);
}

@media (max-width: 768px) {
  .header-logo {
    height: 36px;
  }
  .header-divider {
    display: none;
  }
  .header-title {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 12px;
  }
}
</style>



