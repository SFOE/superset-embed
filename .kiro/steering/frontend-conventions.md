---
inclusion: manual
---

# Frontend conventions - superset-embed

State-of-the-art conventions for this repo, aligned with SFOE/drill-frontend.
Read this before changing tooling, tests, or CI.

## What this app is

A thin, config-driven Vue 3 shell that embeds **public** Apache Superset
dashboards in an admin.ch-styled frame. It owns NO dashboard content - Superset
does. A dashboard is published by adding an entry to `public/dashboards.json`
(a URL slug -> per-locale Superset UUID map). The app has exactly one generic
`DashboardView`; there is no per-dashboard code.

## Architecture rules

- **No per-dashboard code.** Routes and resolution derive from the registry at
  runtime. Never hardcode a dashboard name, UUID, or route in source.
- **Registry is the contract.** `src/registry.ts` is the only place that parses
  and validates `dashboards.json`. Keep its functions pure and tested.
- **UUID, not numeric id.** Embed dashboards by their Superset UUID (stable
  across rebuilds).
- **DE fallback.** A missing per-locale UUID falls back to `de`.

## Stack

- Vue 3 (`<script setup lang="ts">`), Vite, Pinia, vue-router, vue-i18n.
- TypeScript with split tsconfigs (`app` / `node` / `vitest`), type-checked via
  `vue-tsc --build` (`npm run type-check`).

## Testing

- **Unit:** Vitest. Pure logic (the registry) gets unit tests AND
  property-based tests with `fast-check` (`@fast-check/vitest`). Component tests
  use `@vue/test-utils` + jsdom (opt into jsdom per-file with
  `// @vitest-environment jsdom`).
- **E2E:** Cypress. The smoke spec stubs `/dashboards.json` with a fixture
  (`cypress/fixtures/dashboards.json`) via `cy.intercept` so e2e does NOT need a
  live Superset. Assert routing + iframe src + the not-found state.
- Run: `npm run test:unit`, `npm run test:e2e` (builds + previews + runs Cypress
  via start-server-and-test), `npm run test:e2e:dev` (interactive).

## Linting & formatting

- ESLint flat config (`eslint.config.ts`): `@vue/eslint-config-typescript` +
  `eslint-plugin-vue` (flat/essential) + a Cypress block + prettier
  skip-formatting. `npm run lint` (autofix + cache).
- Prettier (`.prettierrc.json`): `npm run format`.
- Generated artifacts (`*.config.js`, `*.config.d.ts`, `*.tsbuildinfo`,
  `coverage/`, `dist/`) are git-ignored and eslint-ignored - never commit them.

## Security

- `audit-ci` gates CI (`.github/workflows/security.yml`,
  `npx audit-ci --config ./audit-ci.jsonc`), not plain `npm audit`.
- Start with an EMPTY allowlist in `audit-ci.jsonc`. Only add an entry for an
  advisory that is (a) dev-only / not shipped, and (b) has no upstream fix.
  Path-scope it, add a note and an `expiry`, and re-check at expiry.
- Pin transitive security fixes via npm `overrides` in package.json when needed.
- Never commit secrets; `.env*`, keys, tokens are git-ignored.

## Automation

- **Dependabot** (`.github/dependabot.yml`): weekly, grouped minor+patch PRs
  with cooldown windows, for npm + github-actions. Review and merge these; keep
  CI green.
- **CI workflows** (Node 24, `npm ci --ignore-scripts`): `lint`, `unit_tests`
  (type-check + coverage), `e2e_tests` (Cypress), `security` (audit-ci). All
  must pass on PRs to `main`.

## Adding a dashboard (the common task)

No code. Build + publish the dashboard in Superset, copy its per-locale UUIDs,
add `{ "name": "<slug>", "uuid": { "de": "...", ... } }` to
`public/dashboards.json`, commit. `name` must match `^[a-z0-9][a-z0-9-]*$`.
For a language-neutral dashboard, point all locales at the same UUID (or just
set `de`). Only list PUBLIC dashboards.
