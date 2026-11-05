// Registry types + loader for the config-driven dashboard viewer.
//
// The registry (public/dashboards.json) maps a POSIX slug `name` to per-locale
// Superset dashboard UUIDs. This module defines the typed shape and loads +
// sanitizes the file at runtime. Resolution helpers (findEntry, defaultEntry,
// resolveUuid) live at the bottom of this module.
//
// Keep this module import-safe: no top-level side effects.

export type Locale = 'de' | 'fr' | 'it' | 'en'

export interface RegistryEntry {
  name: string
  uuid: Partial<Record<Locale, string>> // 'de' expected
}

export interface Registry {
  default?: string
  dashboards: RegistryEntry[]
}

/** URL-safe POSIX slug: lowercase alphanumerics and hyphens, not leading with a hyphen. */
export const NAME_RE = /^[a-z0-9][a-z0-9-]*$/

/**
 * Fetch and sanitize `public/dashboards.json`.
 *
 * Sanitization (Req 4):
 * - drop entries whose `name` is missing or fails NAME_RE (warn)
 * - de-duplicate by `name`, keeping the first occurrence (warn)
 * - exclude entries whose `uuid` is missing, not an object, or empty (warn)
 * - preserve the top-level `default` string as-is (resolution validates it)
 *
 * On any fetch/parse failure, warn and return an empty registry.
 */
export async function loadRegistry(): Promise<Registry> {
  let raw: unknown
  try {
    const res = await fetch('/dashboards.json')
    if (!res.ok) {
      console.warn(`[registry] failed to fetch /dashboards.json: HTTP ${res.status}`)
      return { dashboards: [] }
    }
    raw = await res.json()
  } catch (err) {
    console.warn('[registry] failed to fetch or parse /dashboards.json:', err)
    return { dashboards: [] }
  }

  if (raw === null || typeof raw !== 'object') {
    console.warn('[registry] /dashboards.json is not an object; returning empty registry')
    return { dashboards: [] }
  }

  const source = raw as Record<string, unknown>

  const defaultName = typeof source.default === 'string' ? source.default : undefined

  const rawDashboards = Array.isArray(source.dashboards) ? source.dashboards : []
  if (!Array.isArray(source.dashboards)) {
    console.warn('[registry] missing or non-array `dashboards`; treating as empty')
  }

  const dashboards: RegistryEntry[] = []
  const seen = new Set<string>()

  for (const candidate of rawDashboards) {
    if (candidate === null || typeof candidate !== 'object') {
      console.warn('[registry] ignoring non-object entry:', candidate)
      continue
    }

    const entry = candidate as Record<string, unknown>
    const name = entry.name

    // name must be a present string matching the POSIX pattern.
    if (typeof name !== 'string' || !NAME_RE.test(name)) {
      console.warn(`[registry] ignoring entry with invalid name: ${JSON.stringify(name)}`)
      continue
    }

    // de-duplicate by name, keeping the first occurrence.
    if (seen.has(name)) {
      console.warn(`[registry] ignoring duplicate entry for name: ${name} (keeping first)`)
      continue
    }

    // uuid must be a non-empty object.
    const uuid = entry.uuid
    if (uuid === null || typeof uuid !== 'object' || Array.isArray(uuid)) {
      console.warn(`[registry] ignoring entry "${name}": uuid is missing or not an object`)
      continue
    }
    if (Object.keys(uuid as Record<string, unknown>).length === 0) {
      console.warn(`[registry] ignoring entry "${name}": uuid map is empty`)
      continue
    }

    seen.add(name)
    dashboards.push({ name, uuid: uuid as Partial<Record<Locale, string>> })
  }

  const registry: Registry = { dashboards }
  if (defaultName !== undefined) {
    registry.default = defaultName
  }
  return registry
}

/**
 * Resolve an entry by its exact `name`.
 *
 * Matching is case-sensitive and byte-for-byte: no fuzzy, prefix, or
 * case-insensitive matching (Req 2.5). Returns null when no entry matches.
 *
 * Property 2: returns an entry only when its `name` equals the input exactly.
 */
export function findEntry(reg: Registry, name: string): RegistryEntry | null {
  for (const entry of reg.dashboards) {
    if (entry.name === name) {
      return entry
    }
  }
  return null
}

/**
 * Pick the entry for the root path.
 *
 * Precedence (Req 2.4): the entry named by `reg.default` when it matches an
 * entry; else the first entry in `reg.dashboards`; else null (empty registry).
 *
 * Property 4: this precedence is total — it yields a defined result for every
 * possible registry.
 */
export function defaultEntry(reg: Registry): RegistryEntry | null {
  if (reg.default !== undefined) {
    const named = findEntry(reg, reg.default)
    if (named !== null) {
      return named
    }
  }
  return reg.dashboards.length > 0 ? reg.dashboards[0] : null
}

/**
 * Resolve the Dashboard_UUID for an entry at a given locale.
 *
 * Returns `entry.uuid[locale]` when present and non-empty; else the `de`
 * (German) UUID when present and non-empty (Req 3.3); else null.
 *
 * Property 3: the returned value, when non-null, is always a string that
 * exists in `entry.uuid` — this function never fabricates a UUID.
 */
export function resolveUuid(entry: RegistryEntry, locale: Locale): string | null {
  const direct = entry.uuid[locale]
  if (typeof direct === 'string' && direct.length > 0) {
    return direct
  }

  const german = entry.uuid.de
  if (typeof german === 'string' && german.length > 0) {
    return german
  }

  return null
}
