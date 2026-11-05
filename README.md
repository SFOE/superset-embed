# superset-embed

[![CI - Lint](https://github.com/SFOE/superset-embed/actions/workflows/lint.yml/badge.svg)](https://github.com/SFOE/superset-embed/actions/workflows/lint.yml)
[![CI - Unit tests](https://github.com/SFOE/superset-embed/actions/workflows/unit_tests.yml/badge.svg)](https://github.com/SFOE/superset-embed/actions/workflows/unit_tests.yml)
[![CI - e2e tests](https://github.com/SFOE/superset-embed/actions/workflows/e2e_tests.yml/badge.svg)](https://github.com/SFOE/superset-embed/actions/workflows/e2e_tests.yml)
[![CI - Security](https://github.com/SFOE/superset-embed/actions/workflows/security.yml/badge.svg)](https://github.com/SFOE/superset-embed/actions/workflows/security.yml)

![Repo Owner](https://img.shields.io/badge/Repo_Owner-Team%20DI-blue)
![Repo Custodian](https://img.shields.io/badge/Repo_Custodian-Team%20DI-blue)
![Section](https://img.shields.io/badge/Section-DI-lightgrey)
![Status](https://img.shields.io/badge/Status-in--development-yellow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A thin, config-driven Vue 3 shell that embeds **public Apache Superset
dashboards** (BFE/SFOE geodata) in a Swiss Confederation (admin.ch) styled frame.
Multilingual (DE/FR/IT/EN). Superset owns all dashboard content; this app maps a
URL slug to per-locale Superset dashboard UUIDs via one in-repo registry file,
`public/dashboards.json`. A dashboard is served at `/<name>`.

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
```

Point the app at your Superset with `VITE_SUPERSET_URL` (in `.env`, default
`http://localhost:8088`). Superset dashboards must be public (anonymous).

Scripts: `npm run build`, `npm run type-check`, `npm run test:unit`,
`npm run test:e2e`, `npm run lint`, `npm run format`.

## How to add / integrate a new dashboard

No code, no rebuild - just edit `public/dashboards.json`.

1. **Build and publish** the dashboard in Superset, and make it **public**
   (grant the Public role access to the dashboard and its charts/datasets).
   Build one per language if you want translated content.
2. **Copy its UUID** from the Superset URL `/superset/dashboard/<uuid>/` (or
   from Edit dashboard -> Edit properties). Note one UUID per language.
3. **Add an entry** under `dashboards`:

   ```json
   {
     "name": "my-dashboard",
     "uuid": {
       "de": "<dashboard-uuid>",
       "fr": "<dashboard-uuid>",
       "it": "<dashboard-uuid>",
       "en": "<dashboard-uuid>"
     }
   }
   ```

   - `name` is a POSIX URL slug matching `^[a-z0-9][a-z0-9-]*$`; the dashboard is
     served at `/<name>`.
   - `de` is required and is the fallback for any missing locale.
   - Optionally set the top-level `"default"` to a `name` to serve it at `/`.
   - **Language-neutral dashboard?** Point all four locales at the same UUID, or
     provide only `de`. No need to duplicate a dashboard in Superset unless you
     actually translate its content.
4. **Commit.** On reload the app serves `/<name>`; the language switcher selects
   which per-locale UUID the iframe loads.

The registry is validated by `public/dashboards.schema.json`, so an editor flags
mistakes before runtime. Only **public** dashboards may be listed - the app does
not authenticate, so a non-public dashboard will not render for anonymous
viewers.

## Keeping the project up to date (maintenance)

- **Dependencies:** Dependabot opens weekly, grouped minor+patch PRs (npm +
  GitHub Actions). Review and merge them; keep CI green. Majors come as separate
  PRs - read the changelog before merging.
- **CI gates** (must stay green on PRs to `main`):
  - `npm run lint` - ESLint (flat config) + Prettier.
  - `npm run type-check` - `vue-tsc --build`.
  - `npm run test:unit` - Vitest (unit + fast-check property tests + component
    tests). Coverage via `npx vitest --run --coverage`.
  - `npm run test:e2e` - Cypress smoke test (stubs the registry; no live
    Superset needed).
  - `npx audit-ci --config ./audit-ci.jsonc` - security audit.
- **Security advisories:** if `audit-ci` flags an unfixable, dev-only advisory,
  add a path-scoped entry to `audit-ci.jsonc` with a note and an `expiry`; pin
  transitive fixes via npm `overrides` in `package.json` when a fix exists.

## Conventions

See `.kiro/steering/frontend-conventions.md` for the full engineering
conventions (architecture, testing, linting, security, automation).

## License

MIT - see `LICENSE`.
