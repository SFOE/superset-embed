<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="full-bleed footer-box">
    <div class="app-container footer-inner">
      <div class="footer-left">
        <span class="footer-app-title">{{ t('header_title') }}</span>
      </div>
      <div class="footer-center">
        <a
          href="https://www.admin.ch/gov/de/start/rechtliches.html"
          target="_blank"
          rel="noopener"
          class="footer-link"
        >
          {{ t('footer_terms') }}
        </a>
        <a
          href="mailto:contact@bfe.admin.ch"
          class="footer-link"
        >
          {{ t('footer_contact') }}
        </a>
      </div>
      <div class="footer-right">
        <span class="footer-copyright">&copy; {{ year }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-box {
  background: var(--color-primary);
  color: #fff;
  padding: 24px 0;
  font-size: 0.875rem;
  margin-top: auto;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.footer-app-title {
  font-weight: 500;
}

.footer-center {
  display: flex;
  gap: 24px;
}

.footer-copyright {
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 768px) {
  .footer-inner {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}
</style>
