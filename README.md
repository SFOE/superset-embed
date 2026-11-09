# superset-embed

[![CI - Lint](https://github.com/SFOE/superset-embed/actions/workflows/lint.yml/badge.svg)](https://github.com/SFOE/superset-embed/actions/workflows/lint.yml)
[![CI - Unit tests](https://github.com/SFOE/superset-embed/actions/workflows/unit_tests.yml/badge.svg)](https://github.com/SFOE/superset-embed/actions/workflows/unit_tests.yml)
[![CI - e2e tests](https://github.com/SFOE/superset-embed/actions/workflows/e2e_tests.yml/badge.svg)](https://github.com/SFOE/superset-embed/actions/workflows/e2e_tests.yml)
[![CI - Security](https://github.com/SFOE/superset-embed/actions/workflows/security.yml/badge.svg)](https://github.com/SFOE/superset-embed/actions/workflows/security.yml)
[![Publish to S3](https://github.com/SFOE/superset-embed/actions/workflows/release_and_push_s3.yml/badge.svg)](https://github.com/SFOE/superset-embed/actions/workflows/release_and_push_s3.yml)

![Repo Owner](https://img.shields.io/badge/Repo_Owner-Team%20DI-blue)
![Repo Custodian](https://img.shields.io/badge/Repo_Custodian-Team%20DI-blue)
![Section](https://img.shields.io/badge/Section-DI-lightgrey)
![Status](https://img.shields.io/badge/Status-in--development-yellow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A thin, config-driven **Vue 3** shell that embeds **public Apache Superset
dashboards** in a Swiss Confederation (admin.ch) styled, multilingual
(DE / FR / IT / EN) frame.

Superset owns all dashboard content. This app adds the federal look and feel, a
language switcher, and friendly URLs. It maps a URL slug to per-locale Superset
dashboard UUIDs through a single in-repo registry file — no backend, no
database, no build step to publish a new dashboard.

> Built by the Swiss Federal Office of Energy (SFOE) for its own geodata
> dashboards, but deliberately generic: it has no BFE/SFOE-specific logic and
> can be re-pointed at any public Superset instance. See
> [Reuse it for your own dashboards](#reuse-it-for-your-own-dashboards).

<img width="1261" height="763" alt="image" src="https://github.com/user-attachments/assets/99ec2b3d-4e35-4728-a481-03bbfc15630c" />

## Table of contents

- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Add or update a dashboard](#add-or-update-a-dashboard)
- [Reuse it for your own dashboards](#reuse-it-for-your-own-dashboards)
- [Styling Superset to match (Swiss Design System)](#styling-superset-to-match-swiss-design-system)
- [Deployment](#deployment)
- [Development](#development)
- [Maintenance](#maintenance)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## How it works

```
Browser  ──▶  superset-embed  ──▶  <iframe>  ──▶  Apache Superset
   /<slug>        (this app)         standalone        (public dashboard)
```

1. A visitor opens `/<slug>` (for example `/biogas`). The root path `/` serves
   the configured default.
2. The app looks the slug up in the registry (`public/dashboards.json`), which
   maps each slug to one Superset dashboard UUID **per language**.
3. It resolves the UUID for the active language (falling back to German if a
   language is missing) and embeds that Superset dashboard in an iframe.
4. The language switcher reloads the iframe with the UUID for the chosen
   language; the dashboard itself is rendered entirely by Superset.

The registry is the only thing you edit to add dashboards — it is plain JSON,
validated against a JSON Schema, and read at runtime. The app never
authenticates, so only **public (anonymous)** Superset dashboards can be shown.

## Quick start

Prerequisites: **Node.js >= 22.12** and a reachable Apache Superset instance
with at least one public dashboard.

```bash
git clone https://github.com/SFOE/superset-embed.git
cd superset-embed
npm install
cp .env.example .env     # then set VITE_SUPERSET_URL
npm run dev              # http://localhost:5173
```

By default the app points at `http://localhost:8088`. Set `VITE_SUPERSET_URL`
in `.env` to target your own Superset.

## Configuration

| Variable            | Default                 | Description                                          |
| ------------------- | ----------------------- | ---------------------------------------------------- |
| `VITE_SUPERSET_URL` | `http://localhost:8088` | Origin of the Superset instance the app embeds from. |

Everything else is configured through the registry file (see below). The app
has no server-side configuration.

## Add or update a dashboard

No code and no rebuild — just edit `public/dashboards.json`.

1. **Publish the dashboard in Superset and make it public.** Grant the Public
   role access to the dashboard and its charts/datasets. Build one dashboard per
   language only if you actually translate its content.
2. **Copy the UUID** from the Superset URL `/superset/dashboard/<uuid>/` (or from
   _Edit dashboard → Edit properties_). Note one UUID per language.
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

   - `name` is a URL slug matching `^[a-z0-9][a-z0-9-]*$`; the dashboard is
     served at `/<name>`.
   - `de` is required and is the fallback for any missing language.
   - Set the top-level `"default"` to a `name` to serve that dashboard at `/`.
     If omitted, the first entry is used.
   - **Language-neutral dashboard?** Point all four languages at the same UUID
     (or provide only `de`). No need to duplicate it in Superset.

4. **Commit.** On reload the app serves `/<name>`; the language switcher chooses
   which per-language UUID the iframe loads.

The registry is validated by `public/dashboards.schema.json`, so an editor
flags mistakes before runtime, and malformed entries are skipped with a console
warning rather than breaking the app. Only **public** dashboards render for
anonymous viewers.

## Reuse it for your own dashboards

This app has no SFOE-specific logic — the branding lives in a handful of
assets and config values. To adopt it for another office or project:

- **Superset target** — set `VITE_SUPERSET_URL` to your instance.
- **Dashboards** — replace `public/dashboards.json` with your own slugs and
  UUIDs.
- **Title** — edit `header_title` in `src/locales/{de,fr,it,en}.json`.
- **Logo & favicon** — replace `src/assets/logo.png` (and the mobile
  `swiss_mobile.svg`) and `public/favicon.png`.
- **Colors & styling** — adjust the design tokens in `src/assets/base.css`.
- **Languages** — the app ships DE / FR / IT / EN; add or remove locales in
  `src/locales/` and the language switcher.
- **License** — update the copyright holder in `LICENSE` and the metadata in
  `METADATA.yaml`.

The MIT license lets you fork and adapt freely; attribution is appreciated.

## Styling Superset to match (Swiss Design System)

This app styles its own shell (header, footer, select). The embedded dashboards
are rendered by Superset, so their look comes from **Superset's own theme** —
not from this repo. To make the dashboards match the Swiss Confederation
(admin.ch) / [Swiss Design System](https://swiss.github.io/designsystem/) look,
brand Superset itself.

The reliable, supported way is the global **theme** (Superset 6.x uses Ant
Design design tokens). Add a `THEME_DEFAULT` to your `superset_config.py`. It
applies to every dashboard **and** to the `standalone=2` pages this app embeds,
so new dashboards inherit it for free:

```python
# superset_config.py — global Swiss Design System theme
THEME_DEFAULT = {
    "token": {
        "colorPrimary": "#2f4356",   # Swiss Confederation dark blue-grey
        "colorLink": "#005ea5",
        "colorError": "#d8232a",     # Swiss red
        # White surfaces everywhere (admin.ch flat look):
        "colorBgLayout": "#ffffff",
        "colorBgContainer": "#ffffff",
        "colorBgElevated": "#ffffff",
        # Borderless cards: white borders + zero line width:
        "colorBorder": "#ffffff",
        "colorBorderSecondary": "#ffffff",
        "colorSplit": "#ffffff",
        "lineWidth": 0,
        # Noto Sans is the Swiss Design System's open web font. The official
        # CD Bund Frutiger is licensed and cannot be self-hosted.
        "fontUrls": [
            "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&display=swap",
        ],
        "fontFamily": "'Noto Sans', Helvetica, Arial, sans-serif",
        "fontWeightStrong": "600",
    },
    "algorithm": "default",
}
THEME_DARK = None  # force a single light theme — no dark-mode toggle
```

Restart Superset after editing (`docker compose restart superset`).

Notes:

- These are public Swiss Design System color values, not secrets. Keep real
  secrets (`SECRET_KEY`, database credentials) out of any file you commit or
  share.
- The theme tokens above mirror the shell tokens in `src/assets/base.css`, so
  the embedded dashboard and the surrounding frame stay visually consistent.
- **Per-dashboard CSS** (a dashboard's _Edit properties → CSS_) can add small
  layout polish the tokens can't express, but prefer the global theme — it is
  the only path verified to reach the `standalone=2` embed consistently.

## Deployment

Releases are published to AWS S3 and served through CloudFront by the
`prometheon-data-lake-house-<env>` Terraform stacks. The frontend repo only
produces and ships a versioned build artifact; the Terraform stack promotes it
to the live bucket and invalidates the CDN.

The [`release_and_push_s3.yml`](.github/workflows/release_and_push_s3.yml)
workflow:

- **On a merged PR to `main`** — builds the app and pushes a `latest` artifact
  to the **dev** S3 artifact store.
- **On a published GitHub release** — builds the app and pushes the tagged
  artifact to both the **dev** and **prod** artifact stores, attaches the zip to
  the release, and bumps `frontend_app_version` in the Terraform repos (a direct
  push for dev, a PR for prod).

Both the release-asset upload and the Terraform deploy PR authenticate with a
short-lived token minted from the shared GitHub App
(`actions/create-github-app-token`) rather than the broad default
`GITHUB_TOKEN` — the workflow only requests `contents: read` / `id-token: write`
at the top level.

`VITE_SUPERSET_URL` is **inlined at build time**, so each environment is built
with its own Superset origin. To avoid cross-origin problems the build points at
the Superset **embed** host (`superset-embed-<env>.…`), which exposes only the
public dashboard embed paths and lists the SPA origin as an allowed
frame-ancestor; the SPA is served from a sibling host under the same parent
zone, keeping the iframe and guest-token requests same-site.

Configure these per repository in GitHub (the pipeline role authenticates via
OIDC — no long-lived AWS keys):

| Kind     | Name                                        | Purpose                                         |
| -------- | ------------------------------------------- | ----------------------------------------------- |
| Variable | `SFOE_SUPERSET_EMBED_VITE_SUPERSET_URL_DEV`  | Superset embed origin baked into the dev build  |
| Variable | `SFOE_SUPERSET_EMBED_VITE_SUPERSET_URL_PROD` | Superset embed origin baked into the prod build |
| Variable | `SFOE_SUPERSET_EMBED_S3_BUCKET_DEV`          | Dev S3 artifact store bucket                    |
| Variable | `SFOE_SUPERSET_EMBED_S3_BUCKET_PROD`         | Prod S3 artifact store bucket                   |
| Secret   | `SFOE_SUPERSET_EMBED_PIPELINE_ROLE_DEV`      | OIDC role ARN for the dev artifact store        |
| Secret   | `SFOE_SUPERSET_EMBED_PIPELINE_ROLE_PROD`     | OIDC role ARN for the prod artifact store       |
| Secret   | `GH_APP_ID` / `GH_APP_PRIVATE_KEY`           | GitHub App used to mint short-lived tokens for the release asset upload and the Terraform deploy PR |

## Development

| Task             | Command              |
| ---------------- | -------------------- |
| Dev server       | `npm run dev`        |
| Production build | `npm run build`      |
| Type-check       | `npm run type-check` |
| Unit tests       | `npm run test:unit`  |
| End-to-end tests | `npm run test:e2e`   |
| Lint             | `npm run lint`       |
| Format           | `npm run format`     |

Stack: Vue 3 + TypeScript + Vite, Pinia, Vue Router, Vue I18n. Tests use Vitest
(unit, component, and fast-check property tests) and Cypress (e2e). The e2e
smoke test stubs the registry, so no live Superset is required to run it.

Engineering conventions (architecture, testing, linting, security, automation)
are documented in `.kiro/steering/frontend-conventions.md`.

## Maintenance

- **Dependencies:** Dependabot opens weekly, grouped minor + patch PRs (npm and
  GitHub Actions). Review and merge them and keep CI green. Majors arrive as
  separate PRs — read the changelog before merging.
- **CI gates** (must stay green on PRs to `main`):
  - `npm run lint` — ESLint (flat config) + Prettier.
  - `npm run type-check` — `vue-tsc --build`.
  - `npm run test:unit` — Vitest. Coverage via `npx vitest --run --coverage`.
  - `npm run test:e2e` — Cypress smoke test.
  - `npx audit-ci --config ./audit-ci.jsonc` — security audit.
- **Security advisories:** if `audit-ci` flags an unfixable, dev-only advisory,
  add a path-scoped entry to `audit-ci.jsonc` with a note and an `expiry`, and
  pin transitive fixes via npm `overrides` in `package.json` when a fix exists.

## Security

- The app is **read-only and unauthenticated**: it embeds public Superset
  dashboards and never handles credentials or user data.
- Only list dashboards that are intentionally public — a non-public dashboard
  will not render for anonymous viewers.
- Please report suspected vulnerabilities privately to the repository owner
  rather than opening a public issue.

## Contributing

Issues and pull requests are welcome. Please open an issue to discuss larger
changes first, keep CI green (lint, type-check, unit, e2e, security), and follow
the conventions in `.kiro/steering/frontend-conventions.md`.

## License

[MIT](LICENSE) — © Swiss Federal Office of Energy (SFOE) / Bundesamt für
Energie (BFE).
