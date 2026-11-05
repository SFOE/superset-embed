import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // The Vue plugin lets vitest compile `.vue` SFCs imported by component tests
  // (src/views/DashboardView.test.ts). The pure-TS registry tests don't need it
  // but it's inert for them.
  plugins: [vue()],
  test: {
    // Default to node so the existing registry tests keep their fast, DOM-less
    // environment. Component tests opt into jsdom per-file via a
    // `// @vitest-environment jsdom` docblock at the top of the file.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
