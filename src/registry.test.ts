// Unit + property-based tests for the dashboard registry module.
//
// Covers the four Correctness Properties from the dashboard-registry design:
//   P1 loadRegistry sanitization  (Req 4.1, 4.2, 4.3)
//   P2 findEntry exact/case-sensitive resolution (Req 2.2, 2.5)
//   P3 resolveUuid locale -> de -> null, never fabricated (Req 3.1, 3.3)
//   P4 defaultEntry default -> first -> null, total (Req 2.4)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fc, test } from '@fast-check/vitest'
import {
  defaultEntry,
  findEntry,
  loadRegistry,
  NAME_RE,
  resolveUuid,
  type Locale,
  type Registry,
  type RegistryEntry,
} from './registry.ts'

const LOCALES: Locale[] = ['de', 'fr', 'it', 'en']

// --- fast-check arbitraries --------------------------------------------------

// A name that always satisfies NAME_RE: starts with [a-z0-9], then [a-z0-9-]*.
const validName = fc
  .tuple(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    fc.stringMatching(/^[a-z0-9-]*$/),
  )
  .map(([head, tail]) => head + tail)

// An arbitrary short string for the `name` field — may or may not be valid.
const anyName = fc.oneof(
  validName,
  fc.string(),
  fc.constantFrom('', '-leading', 'UPPER', 'has space', 'слон', 'a_b'),
)

// A uuid map keyed by a subset of locales, each a non-empty string.
const uuidMap = fc.dictionary(
  fc.constantFrom(...LOCALES),
  fc.string({ minLength: 1 }),
) as fc.Arbitrary<Partial<Record<Locale, string>>>

// A possibly-empty uuid map (to exercise the empty-map exclusion path).
const maybeEmptyUuidMap = fc.dictionary(
  fc.constantFrom(...LOCALES),
  fc.string(),
) as fc.Arbitrary<Partial<Record<Locale, string>>>

// A "registry-like" raw object as it would arrive from fetch().json():
// deliberately loose so the sanitizer is exercised against junk.
const rawEntry = fc.record(
  {
    name: fc.oneof(anyName, fc.integer(), fc.constant(null), fc.constant(undefined)),
    uuid: fc.oneof(
      maybeEmptyUuidMap,
      fc.constant(null),
      fc.constant(undefined),
      fc.string(),
      fc.array(fc.string()),
    ),
  },
  { requiredKeys: [] },
)

const rawRegistry = fc.record(
  {
    default: fc.oneof(anyName, fc.constant(undefined)),
    dashboards: fc.oneof(fc.array(rawEntry, { maxLength: 8 }), fc.constant(undefined)),
  },
  { requiredKeys: [] },
)

// A well-formed sanitized entry (for findEntry / defaultEntry / resolveUuid).
const cleanEntry: fc.Arbitrary<RegistryEntry> = fc.record({
  name: validName,
  uuid: uuidMap.filter((m) => Object.keys(m).length > 0),
})

// A registry with unique names and an optional default that may or may not match.
const cleanRegistry: fc.Arbitrary<Registry> = fc
  .uniqueArray(cleanEntry, { selector: (e) => e.name, maxLength: 6 })
  .chain((dashboards) =>
    fc
      .oneof(
        fc.constant<string | undefined>(undefined),
        ...(dashboards.length > 0
          ? [fc.constantFrom(...dashboards.map((d) => d.name))]
          : []),
        validName, // a default that likely does not match
      )
      .map((def) => (def === undefined ? { dashboards } : { default: def, dashboards })),
  )

// --- fetch mocking helper ----------------------------------------------------

function mockFetchJson(payload: unknown, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status,
      json: async () => payload,
    })),
  )
}

// =============================================================================
// Property 1: loadRegistry returns only valid, de-duplicated, non-empty entries
// Validates: Requirements 4.1, 4.2, 4.3
// =============================================================================

describe('Property 1: loadRegistry sanitization', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test.prop([rawRegistry])(
    'every returned entry is NAME_RE-valid, has a non-empty uuid, and names are unique',
    async (raw) => {
      mockFetchJson(raw)
      const reg = await loadRegistry()

      const names = reg.dashboards.map((e) => e.name)
      // unique names
      expect(new Set(names).size).toBe(names.length)

      for (const entry of reg.dashboards) {
        expect(NAME_RE.test(entry.name)).toBe(true)
        expect(typeof entry.uuid).toBe('object')
        expect(entry.uuid).not.toBeNull()
        expect(Object.keys(entry.uuid).length).toBeGreaterThan(0)
      }
    },
  )

  it('drops entries with an invalid name', async () => {
    mockFetchJson({
      dashboards: [
        { name: 'Valid-One', uuid: { de: 'u1' } }, // uppercase -> invalid
        { name: '-leading', uuid: { de: 'u2' } }, // leading hyphen -> invalid
        { name: 'good', uuid: { de: 'u3' } },
      ],
    })
    const reg = await loadRegistry()
    expect(reg.dashboards.map((e) => e.name)).toEqual(['good'])
  })

  it('de-duplicates by name, keeping the first occurrence', async () => {
    mockFetchJson({
      dashboards: [
        { name: 'dup', uuid: { de: 'first' } },
        { name: 'dup', uuid: { de: 'second' } },
      ],
    })
    const reg = await loadRegistry()
    expect(reg.dashboards).toHaveLength(1)
    expect(reg.dashboards[0].uuid.de).toBe('first')
  })

  it('excludes entries whose uuid is missing, not an object, or empty', async () => {
    mockFetchJson({
      dashboards: [
        { name: 'missing' }, // no uuid
        { name: 'empty', uuid: {} }, // empty map
        { name: 'notobj', uuid: 'nope' }, // not an object
        { name: 'arr', uuid: ['a'] }, // array
        { name: 'kept', uuid: { de: 'ok' } },
      ],
    })
    const reg = await loadRegistry()
    expect(reg.dashboards.map((e) => e.name)).toEqual(['kept'])
  })

  it('preserves the top-level default string as-is', async () => {
    mockFetchJson({ default: 'biogas', dashboards: [{ name: 'biogas', uuid: { de: 'x' } }] })
    const reg = await loadRegistry()
    expect(reg.default).toBe('biogas')
  })

  it('returns an empty registry when fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    const reg = await loadRegistry()
    expect(reg).toEqual({ dashboards: [] })
  })

  it('returns an empty registry on a non-ok HTTP response', async () => {
    mockFetchJson(null, false, 404)
    const reg = await loadRegistry()
    expect(reg).toEqual({ dashboards: [] })
  })

  it('returns an empty registry when the payload is not an object', async () => {
    mockFetchJson('not an object')
    const reg = await loadRegistry()
    expect(reg).toEqual({ dashboards: [] })
  })

  it('treats a missing/non-array dashboards field as empty', async () => {
    mockFetchJson({ default: 'x' })
    const reg = await loadRegistry()
    expect(reg.dashboards).toEqual([])
    expect(reg.default).toBe('x')
  })
})

// =============================================================================
// Property 2: findEntry is exact and case-sensitive
// Validates: Requirements 2.2, 2.5
// =============================================================================

describe('Property 2: findEntry exact, case-sensitive resolution', () => {
  test.prop([cleanRegistry])(
    'exact name matches; differing-case or partial inputs never match',
    (reg) => {
      for (const entry of reg.dashboards) {
        // exact input matches and returns that entry
        expect(findEntry(reg, entry.name)).toBe(entry)

        // a differing-case variant must not match (names are all lowercase,
        // so uppercasing changes at least one letter when letters are present)
        const upper = entry.name.toUpperCase()
        if (upper !== entry.name) {
          expect(findEntry(reg, upper)).toBeNull()
        }

        // a strict prefix must not match (it is shorter -> not byte-equal)
        const prefix = entry.name.slice(0, -1)
        if (!reg.dashboards.some((e) => e.name === prefix)) {
          expect(findEntry(reg, prefix)).toBeNull()
        }
      }
    },
  )

  test.prop([cleanRegistry, fc.string()])(
    'a result is returned only when its name equals the input exactly',
    (reg, query) => {
      const result = findEntry(reg, query)
      if (result !== null) {
        expect(result.name).toBe(query)
      } else {
        expect(reg.dashboards.some((e) => e.name === query)).toBe(false)
      }
    },
  )

  it('is case-sensitive for a concrete example', () => {
    const reg: Registry = { dashboards: [{ name: 'biogas', uuid: { de: 'x' } }] }
    expect(findEntry(reg, 'biogas')?.name).toBe('biogas')
    expect(findEntry(reg, 'Biogas')).toBeNull()
    expect(findEntry(reg, 'bio')).toBeNull()
    expect(findEntry(reg, 'biogass')).toBeNull()
  })
})

// =============================================================================
// Property 3: resolveUuid falls back to de and never fabricates
// Validates: Requirements 3.1, 3.3
// =============================================================================

describe('Property 3: resolveUuid locale -> de -> null', () => {
  test.prop([cleanEntry, fc.constantFrom(...LOCALES)])(
    'returns locale uuid, else de, else null; a non-null result exists in uuid',
    (entry, locale) => {
      const result = resolveUuid(entry, locale)

      const direct = entry.uuid[locale]
      const german = entry.uuid.de

      if (typeof direct === 'string' && direct.length > 0) {
        expect(result).toBe(direct)
      } else if (typeof german === 'string' && german.length > 0) {
        expect(result).toBe(german)
      } else {
        expect(result).toBeNull()
      }

      // never fabricates: a non-null result is always a value in the map
      if (result !== null) {
        expect(Object.values(entry.uuid)).toContain(result)
      }
    },
  )

  it('returns the requested locale when present', () => {
    const entry: RegistryEntry = { name: 'x', uuid: { de: 'd', fr: 'f' } }
    expect(resolveUuid(entry, 'fr')).toBe('f')
  })

  it('falls back to de when the requested locale is absent', () => {
    const entry: RegistryEntry = { name: 'x', uuid: { de: 'd' } }
    expect(resolveUuid(entry, 'it')).toBe('d')
  })

  it('returns null when neither the locale nor de is present', () => {
    const entry: RegistryEntry = { name: 'x', uuid: { fr: 'f' } }
    expect(resolveUuid(entry, 'it')).toBeNull()
  })
})

// =============================================================================
// Property 4: defaultEntry precedence is total (default -> first -> null)
// Validates: Requirements 2.4
// =============================================================================

describe('Property 4: defaultEntry precedence is total', () => {
  test.prop([cleanRegistry])(
    'default when it matches, else first, else null — defined for every registry',
    (reg) => {
      const result = defaultEntry(reg)

      const named =
        reg.default !== undefined
          ? (reg.dashboards.find((e) => e.name === reg.default) ?? null)
          : null

      if (named !== null) {
        expect(result).toBe(named)
      } else if (reg.dashboards.length > 0) {
        expect(result).toBe(reg.dashboards[0])
      } else {
        expect(result).toBeNull()
      }
    },
  )

  it('uses the named default when it matches', () => {
    const reg: Registry = {
      default: 'b',
      dashboards: [
        { name: 'a', uuid: { de: '1' } },
        { name: 'b', uuid: { de: '2' } },
      ],
    }
    expect(defaultEntry(reg)?.name).toBe('b')
  })

  it('falls back to the first entry when default does not match', () => {
    const reg: Registry = {
      default: 'missing',
      dashboards: [
        { name: 'a', uuid: { de: '1' } },
        { name: 'b', uuid: { de: '2' } },
      ],
    }
    expect(defaultEntry(reg)?.name).toBe('a')
  })

  it('falls back to the first entry when there is no default', () => {
    const reg: Registry = { dashboards: [{ name: 'a', uuid: { de: '1' } }] }
    expect(defaultEntry(reg)?.name).toBe('a')
  })

  it('returns null for an empty registry', () => {
    expect(defaultEntry({ dashboards: [] })).toBeNull()
  })
})
