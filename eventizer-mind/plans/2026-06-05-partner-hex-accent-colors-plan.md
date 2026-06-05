# Partner Hex Accent Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the partners `accentColor` enum with a free hex color (swatch + hex admin field), drive the Partners carousel tint from the hex via inline styles, and give each existing partner a unique color.

**Architecture:** A pure `accent.ts` helper turns a hex into inline-style values (`solid`/`bg`/`bgSoft`/`border`); the carousel client swaps Tailwind accent classes for `style={{}}`. The Payload field becomes `type: 'text'` with a custom `'use client'` swatch+hex component, and a migration converts the enum column to `varchar`, applies the curated palette by id, and drops the enum type.

**Tech Stack:** Payload CMS (`@payloadcms/db-vercel-postgres`, `@payloadcms/ui` `useField`), Next.js RSC + `motion/react`, Tailwind, vitest (jsdom).

**Spec:** [`eventizer-mind/specs/2026-06-05-partner-hex-accent-colors-design.md`](../specs/2026-06-05-partner-hex-accent-colors-design.md)

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `src/blocks/Partners/accent.ts` | Pure hex→inline-style helpers (`normalizeHex`, `hexToRgba`, `resolveAccent`) | Create |
| `tests/int/blocks/partnersAccent.int.spec.ts` | Unit tests for the helpers | Create |
| `src/components/payload/fields/AccentColorField/index.tsx` | Admin swatch + hex field component | Create |
| `src/collections/Partners.ts` | `accentColor` enum → hex text field | Modify |
| `src/migrations/20260605_130000_partner_accent_hex.ts` | enum→varchar + palette + drop enum | Create |
| `src/migrations/index.ts` | Register migration | Modify |
| `scripts/prepare-migrations.mjs` | `ALWAYS_RUN` set | Modify |
| `src/blocks/Partners/Component.client.tsx` | Carousel tint: classes → inline hex styles | Modify |
| `eventizer-mind/map/zones/content-blocks.md` | Re-stamp `verifiedAt` | Modify |
| `eventizer-mind/map/decisions/partner-hex-accent-colors.md` | "Why" record | Create |

### Testing strategy note

Only the pure helpers (`accent.ts`) get unit tests — that's the one genuinely unit-testable unit
(TDD in Task 1). The admin field component and the carousel render are verified manually + via build
(Task 7), matching the repo's precedent (no `getPayload`/admin-render mocks).

---

## Task 1: Hex accent helpers (TDD)

**Files:**
- Create: `src/blocks/Partners/accent.ts`
- Test: `tests/int/blocks/partnersAccent.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/blocks/partnersAccent.int.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  normalizeHex,
  hexToRgba,
  resolveAccent,
  DEFAULT_ACCENT_HEX,
} from '@/blocks/Partners/accent'

describe('normalizeHex', () => {
  it('keeps a valid 6-digit hex, uppercased', () => {
    expect(normalizeHex('#10b981')).toBe('#10B981')
    expect(normalizeHex('  #3B82F6  ')).toBe('#3B82F6')
  })
  it('falls back to the gold default for invalid/empty/null/undefined/shorthand', () => {
    expect(normalizeHex('')).toBe(DEFAULT_ACCENT_HEX)
    expect(normalizeHex('#fff')).toBe(DEFAULT_ACCENT_HEX)
    expect(normalizeHex('red')).toBe(DEFAULT_ACCENT_HEX)
    expect(normalizeHex(null)).toBe(DEFAULT_ACCENT_HEX)
    expect(normalizeHex(undefined)).toBe(DEFAULT_ACCENT_HEX)
  })
})

describe('hexToRgba', () => {
  it('converts a hex to rgba at the given alpha', () => {
    expect(hexToRgba('#10B981', 0.2)).toBe('rgba(16, 185, 129, 0.2)')
    expect(hexToRgba('#E4A00B', 0.05)).toBe('rgba(228, 160, 11, 0.05)')
  })
  it('uses the default for an invalid hex', () => {
    expect(hexToRgba('nope', 0.5)).toBe('rgba(228, 160, 11, 0.5)')
  })
})

describe('resolveAccent', () => {
  it('produces solid + tints from a hex', () => {
    const a = resolveAccent('#3B82F6')
    expect(a.solid).toBe('#3B82F6')
    expect(a.bg).toBe('rgba(59, 130, 246, 0.2)')
    expect(a.bgSoft).toBe('rgba(59, 130, 246, 0.05)')
    expect(a.border).toBe('rgba(59, 130, 246, 0.3)')
  })
  it('falls back to the gold default when the hex is missing', () => {
    expect(resolveAccent(null).solid).toBe(DEFAULT_ACCENT_HEX)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/blocks/partnersAccent.int.spec.ts`
Expected: FAIL — cannot resolve module `@/blocks/Partners/accent`.

- [ ] **Step 3: Implement the helpers**

Create `src/blocks/Partners/accent.ts`:

```ts
/** Default brand-gold accent, used when a partner has no/invalid hex. */
export const DEFAULT_ACCENT_HEX = '#E4A00B'

const HEX_RE = /^#([0-9a-fA-F]{6})$/

/** Normalize to #RRGGBB uppercase, or the gold default when invalid. */
export function normalizeHex(hex?: string | null): string {
  if (typeof hex === 'string') {
    const trimmed = hex.trim()
    if (HEX_RE.test(trimmed)) return trimmed.toUpperCase()
  }
  return DEFAULT_ACCENT_HEX
}

/** Convert a hex color to an `rgba(r, g, b, alpha)` string. Invalid → default. */
export function hexToRgba(hex: string, alpha: number): string {
  const h = normalizeHex(hex)
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export type Accent = {
  /** Solid hex — text color + SVG ring stroke. */
  solid: string
  /** 20% tint — active avatar background. */
  bg: string
  /** 5% tint — soft glow / inactive avatar background. */
  bgSoft: string
  /** 30% tint — active border. */
  border: string
}

/** Resolve a partner's hex (or null) into inline-style-ready accent values. */
export function resolveAccent(hex?: string | null): Accent {
  const solid = normalizeHex(hex)
  return {
    solid,
    bg: hexToRgba(solid, 0.2),
    bgSoft: hexToRgba(solid, 0.05),
    border: hexToRgba(solid, 0.3),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/blocks/partnersAccent.int.spec.ts`
Expected: PASS (3 suites, 6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/blocks/Partners/accent.ts tests/int/blocks/partnersAccent.int.spec.ts
git commit -m "feat(partners): hex accent helpers (resolveAccent/hexToRgba)"
```

---

## Task 2: Custom admin swatch + hex field component

**Files:**
- Create: `src/components/payload/fields/AccentColorField/index.tsx`

Pattern reference: existing custom fields live under `src/components/payload/fields/<name>/` and are
referenced from collections as `Field: '/components/payload/fields/<name>'` (resolves the default
export). They use `useField` from `@payloadcms/ui`.

- [ ] **Step 1: Create the component**

Create `src/components/payload/fields/AccentColorField/index.tsx`:

```tsx
'use client'

import * as React from 'react'
import { useField, FieldLabel } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

const HEX_RE = /^#([0-9a-fA-F]{6})$/
const DEFAULT_HEX = '#E4A00B'

const boxStyle: React.CSSProperties = {
  height: '2.5rem',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-s, 4px)',
}

export const AccentColorField: React.FC<TextFieldClientProps> = ({ path, field }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const current = typeof value === 'string' ? value : ''
  const swatch = HEX_RE.test(current) ? current : DEFAULT_HEX

  return (
    <div className="field-type text">
      <FieldLabel label={field?.label} path={path} required={field?.required} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="color"
          aria-label="Wybierz kolor"
          value={swatch}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          style={{ ...boxStyle, width: '2.75rem', padding: 0, background: 'none', cursor: 'pointer' }}
        />
        <input
          type="text"
          value={current}
          placeholder={DEFAULT_HEX}
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
          style={{
            ...boxStyle,
            flex: 1,
            padding: '0 0.75rem',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-elevation-800)',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        />
      </div>
      {showError && errorMessage && (
        <div className="field-error" style={{ marginTop: '0.25rem' }}>
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export default AccentColorField
```

Notes: both inputs are bound to the same field value via `useField`, so typing a hex updates the
swatch and picking on the swatch writes the hex back. Theme CSS vars degrade gracefully if absent.

- [ ] **Step 2: Commit**

```bash
git add "src/components/payload/fields/AccentColorField/index.tsx"
git commit -m "feat(partners): AccentColorField admin swatch+hex component"
```

---

## Task 3: Switch the collection field to hex text

**Files:**
- Modify: `src/collections/Partners.ts` (the `accentColor` field, currently `type: 'select'`)

- [ ] **Step 1: Replace the field definition**

In `src/collections/Partners.ts`, replace the entire `accentColor` field object (the
`{ name: 'accentColor', type: 'select', ... options: [...] }`) with:

```ts
    {
      name: 'accentColor',
      type: 'text',
      defaultValue: '#E4A00B',
      label: { en: 'Accent color', pl: 'Kolor akcentu' },
      validate: (val: string | null | undefined) => {
        if (val == null || val === '') return true
        return /^#([0-9a-fA-F]{6})$/.test(val)
          ? true
          : 'Podaj kolor w formacie #RRGGBB (np. #10B981).'
      },
      admin: {
        components: {
          Field: '/components/payload/fields/AccentColorField',
        },
        description: {
          en: 'Brand accent color (hex) used to tint this partner in the Partners carousel.',
          pl: 'Kolor akcentu marki (hex) używany do podświetlenia partnera w karuzeli Partnerów.',
        },
      },
    },
```

If TypeScript objects to the `validate` signature, type it as the field's validate:
`validate: ((val) => { ... }) as TextField['validate']` and add `import type { TextField } from 'payload'` — but try the plain form first.

- [ ] **Step 2: Regenerate types**

Run: `pnpm generate:types`
Expected: completes; in `src/payload-types.ts` the `Partner.accentColor` becomes `string | null`
(no longer the enum union).

Verify: `grep -n "accentColor" src/payload-types.ts` → shows `accentColor?: string | null;`.

- [ ] **Step 3: Regenerate the admin import map**

Run: `pnpm generate:importmap`
Expected: `src/app/(payload)/app/importMap.js` gains an entry for
`/components/payload/fields/AccentColorField#default`.

Verify: `grep -n "AccentColorField" "src/app/(payload)/app/importMap.js"` → at least one match.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Partners.ts src/payload-types.ts "src/app/(payload)/app/importMap.js"
git commit -m "feat(partners): accentColor enum -> hex text field"
```

---

## Task 4: Migration — enum column → hex + palette

**Background:** Vercel build runs `payload migrate` before prerender; a schema change with no
migration breaks the build. `partners` is NOT versioned (no `_partners_v`). Any new migration must be
added to `ALWAYS_RUN` in `scripts/prepare-migrations.mjs` or the prepare step pre-marks it applied and
Vercel silently skips it.

**Files:**
- Create: `src/migrations/20260605_130000_partner_accent_hex.ts`
- Modify: `src/migrations/index.ts`
- Modify: `scripts/prepare-migrations.mjs`

- [ ] **Step 1: Write the migration**

Create `src/migrations/20260605_130000_partner_accent_hex.ts`:

```ts
// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * partners.accent_color: enum → varchar hex. Converts any remaining enum-name
 * values to hex, then assigns a curated unique color per partner (keyed by stable
 * id — partner #8's live name differs from the seed), sets the gold default, and
 * drops the now-unused enum type. Idempotent; `partners` is not versioned.
 * Registered in ALWAYS_RUN (scripts/prepare-migrations.mjs) so Vercel runs it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "partners" ALTER COLUMN "accent_color" DROP DEFAULT;
    ALTER TABLE "partners" ALTER COLUMN "accent_color" TYPE varchar USING "accent_color"::text;

    UPDATE "partners" SET "accent_color" = CASE "accent_color"
      WHEN 'primary' THEN '#0B0B0B' WHEN 'accent' THEN '#E4A00B'
      WHEN 'blue' THEN '#3B82F6'    WHEN 'emerald' THEN '#10B981'
      WHEN 'violet' THEN '#8B5CF6'  WHEN 'rose' THEN '#F43F5E'
      ELSE "accent_color" END
    WHERE "accent_color" !~ '^#';

    UPDATE "partners" SET "accent_color" = '#0B0B0B' WHERE "id" = 1;  -- SkyClub Białystok
    UPDATE "partners" SET "accent_color" = '#3B82F6' WHERE "id" = 2;  -- Meetly
    UPDATE "partners" SET "accent_color" = '#10B981' WHERE "id" = 3;  -- Zielona Lipka (kept)
    UPDATE "partners" SET "accent_color" = '#8B5CF6' WHERE "id" = 4;  -- pod Gromadzyniem
    UPDATE "partners" SET "accent_color" = '#F43F5E' WHERE "id" = 5;  -- Princess Palace
    UPDATE "partners" SET "accent_color" = '#E4A00B' WHERE "id" = 6;  -- DJ SPDR
    UPDATE "partners" SET "accent_color" = '#F97316' WHERE "id" = 7;  -- Misiak Events
    UPDATE "partners" SET "accent_color" = '#EC4899' WHERE "id" = 8;  -- Wesele na głowie
    UPDATE "partners" SET "accent_color" = '#14B8A6' WHERE "id" = 9;  -- Santiago Events
    UPDATE "partners" SET "accent_color" = '#6366F1' WHERE "id" = 10; -- Na Łośmiu Metrach

    ALTER TABLE "partners" ALTER COLUMN "accent_color" SET DEFAULT '#E4A00B';
    DROP TYPE IF EXISTS "enum_partners_accent_color";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Non-restoring: the enum→hex value conversion is lossy. Only reset the default.
  await db.execute(sql`
    ALTER TABLE "partners" ALTER COLUMN "accent_color" DROP DEFAULT;
  `)
}
```

- [ ] **Step 2: Register in the migration index**

In `src/migrations/index.ts`, add the import after the
`20260605_120000_add_partner_show_on_sign_in` import line:

```ts
import * as migration_20260605_130000_partner_accent_hex from './20260605_130000_partner_accent_hex';
```

And add this object as the **last** entry of the `migrations` array (after the
`20260605_120000_add_partner_show_on_sign_in` object):

```ts
  {
    up: migration_20260605_130000_partner_accent_hex.up,
    down: migration_20260605_130000_partner_accent_hex.down,
    name: '20260605_130000_partner_accent_hex'
  },
```

- [ ] **Step 3: Add to `ALWAYS_RUN`**

In `scripts/prepare-migrations.mjs`, add as the **last** entry of the `ALWAYS_RUN` set (after
`'20260605_120000_add_partner_show_on_sign_in'`):

```js
  '20260605_130000_partner_accent_hex',
```

- [ ] **Step 4: Apply locally**

Run: `pnpm payload migrate`
Expected: runs `20260605_130000_partner_accent_hex` without error.

- [ ] **Step 5: Confirm column references**

Run: `grep -rn "accent_color\|partner_accent_hex" src/migrations/20260605_130000_partner_accent_hex.ts | head`
Expected: the ALTER/UPDATE statements above; no `_v` table referenced (partners is unversioned).

- [ ] **Step 6: Commit**

```bash
git add src/migrations/20260605_130000_partner_accent_hex.ts src/migrations/index.ts scripts/prepare-migrations.mjs
git commit -m "feat(partners): migration accent_color enum -> hex + palette"
```

---

## Task 5: Carousel — tint from hex via inline styles

**Files:**
- Modify: `src/blocks/Partners/Component.client.tsx`

- [ ] **Step 1: Replace the accentMap with the shared helper**

In `src/blocks/Partners/Component.client.tsx`, delete the entire `// --- Accent color mapping ---`
block — the `type AccentKey`, the `const accentMap = {...}`, and the `const resolveAccent = ...`
(everything from `type AccentKey =` through the end of `resolveAccent`). Replace with an import near
the top (after the existing `import type { Media } from '@/payload-types'` line):

```ts
import { resolveAccent } from '@/blocks/Partners/accent'
```

Keep `getInitial` and `partnerLogoUrl` as-is. `const activeAccent = resolveAccent(active.accentColor)`
and `const accent = resolveAccent(partner.accentColor)` stay — they now take a hex.

- [ ] **Step 2: Glow background**

Replace the glow `motion.div` className/usage:

```tsx
          className={cn(
            'absolute top-1/3 left-1/2 -translate-x-1/2 w-[640px] h-[420px] rounded-full blur-3xl',
            activeAccent.bgSoft,
          )}
```

with:

```tsx
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[640px] h-[420px] rounded-full blur-3xl"
          style={{ backgroundColor: activeAccent.bgSoft }}
```

- [ ] **Step 3: Avatar container bg + border**

Replace:

```tsx
                    className={cn(
                      'relative flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center overflow-hidden rounded-full border transition-colors duration-500',
                      // Always tint with the partner's accent color so the
                      // logo-less placeholder still feels branded; just
                      // brighter when active.
                      isActive ? accent.bg : accent.bgSoft,
                      isActive ? accent.border : 'border-border/20',
                    )}
```

with:

```tsx
                    className={cn(
                      'relative flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center overflow-hidden rounded-full border transition-colors duration-500',
                      // Tint comes from the partner's hex (inline style below);
                      // keep the neutral border only when inactive.
                      !isActive && 'border-border/20',
                    )}
                    style={{
                      backgroundColor: isActive ? accent.bg : accent.bgSoft,
                      borderColor: isActive ? accent.border : undefined,
                    }}
```

- [ ] **Step 4: Placeholder sweep**

Replace:

```tsx
                        <span
                          className={cn(
                            'absolute inset-0 bg-gradient-to-br from-transparent via-transparent transition-opacity duration-500',
                            isActive ? accent.bg : accent.bgSoft,
                            isActive ? 'opacity-100' : 'opacity-60',
                          )}
                          aria-hidden
                        />
```

with:

```tsx
                        <span
                          className={cn(
                            'absolute inset-0 transition-opacity duration-500',
                            isActive ? 'opacity-100' : 'opacity-60',
                          )}
                          style={{ backgroundColor: isActive ? accent.bg : accent.bgSoft }}
                          aria-hidden
                        />
```

- [ ] **Step 5: Initial letter color**

Replace:

```tsx
                        <span
                          className={cn(
                            'relative font-bebas tracking-wide text-2xl sm:text-3xl lg:text-4xl transition-colors',
                            isActive ? accent.text : cn(accent.text, 'opacity-60'),
                          )}
                        >
                          {getInitial(partner.name)}
                        </span>
```

with:

```tsx
                        <span
                          className={cn(
                            'relative font-bebas tracking-wide text-2xl sm:text-3xl lg:text-4xl transition-colors',
                            !isActive && 'opacity-60',
                          )}
                          style={{ color: accent.solid }}
                        >
                          {getInitial(partner.name)}
                        </span>
```

- [ ] **Step 6: SVG ring stroke (two circles)**

In the progress-ring `<svg>`, both circles use `stroke={accent.ringStroke}`. Change **both**
occurrences to:

```tsx
                        stroke={accent.solid}
```

(There are two: the static background `<circle>` and the animated `<motion.circle>`.)

- [ ] **Step 7: Spotlight heading color**

Replace:

```tsx
                    className={cn(
                      'font-bebas tracking-wide leading-[0.95] text-4xl sm:text-5xl lg:text-6xl text-balance',
                      activeAccent.text,
                    )}
```

with:

```tsx
                    className="font-bebas tracking-wide leading-[0.95] text-4xl sm:text-5xl lg:text-6xl text-balance"
                    style={{ color: activeAccent.solid }}
```

- [ ] **Step 8: Bottom-strip mark color**

Replace:

```tsx
                <span
                  className={cn(
                    'font-bebas tracking-wide text-xl sm:text-2xl lg:text-3xl whitespace-nowrap transition-all duration-300',
                    isActive
                      ? cn(accent.text, 'opacity-100')
                      : 'text-muted-foreground/70 hover:text-foreground',
                  )}
                >
                  {partner.name}
                </span>
```

with:

```tsx
                <span
                  className={cn(
                    'font-bebas tracking-wide text-xl sm:text-2xl lg:text-3xl whitespace-nowrap transition-all duration-300',
                    isActive ? 'opacity-100' : 'text-muted-foreground/70 hover:text-foreground',
                  )}
                  style={isActive ? { color: accent.solid } : undefined}
                >
                  {partner.name}
                </span>
```

- [ ] **Step 9: Verify no stale references + lint**

Run: `grep -n "accent.text\|accent.bg\|accent.border\|ringStroke\|accentMap\|accent.bgSoft" src/blocks/Partners/Component.client.tsx`
Expected: NO matches (all converted; `accent.solid`/`accent.bg`/`accent.bgSoft`/`accent.border` now
appear only inside `style={{}}` — the grep above intentionally omits the `style` forms, so it should
return nothing for the old class usages). If `accentMap`/`ringStroke`/`accent.text` appear, fix them.

Run: `pnpm exec tsc --noEmit 2>&1 | grep "Component.client" || echo "no type errors in carousel"`
Expected: `no type errors in carousel`.

- [ ] **Step 10: Commit**

```bash
git add "src/blocks/Partners/Component.client.tsx"
git commit -m "feat(partners): drive carousel tint from per-partner hex"
```

---

## Task 6: Manual + build verification

- [ ] **Step 1: Re-run the helper unit tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/blocks/partnersAccent.int.spec.ts`
Expected: PASS.

- [ ] **Step 2: Confirm prod-data palette applied**

The migration already ran in Task 4 against the dev/prod DB. Confirm via a one-off check that the
10 partners hold the expected hexes (read-only). Run the dev server only if needed; otherwise rely on
the deploy verification after merge. (No code change.)

- [ ] **Step 3: Visual check (after deploy, or local if dev DB is convenient)**

Open the homepage Partners carousel. Expected: each partner's avatar tint, spotlight name, progress
ring, and bottom-strip mark render in its assigned color (Zielona Lipka green, SkyClub near-black,
Misiak orange, etc.); the admin Partners → color field shows a working swatch + hex input.

- [ ] **Step 4: No commit** — verification only.

---

## Task 7: Mind maintenance (same change)

**Files:**
- Modify: `eventizer-mind/map/zones/content-blocks.md` (`verifiedAt`)
- Create: `eventizer-mind/map/decisions/partner-hex-accent-colors.md`

- [ ] **Step 1: Capture HEAD**

Run: `git rev-parse HEAD` → `<HEAD>`.

- [ ] **Step 2: Write the decision record**

Create `eventizer-mind/map/decisions/partner-hex-accent-colors.md`:

```markdown
---
type: decision
summary: "Partner accentColor moved from a fixed enum to a free hex (swatch+hex admin field); the Partners carousel tints from the hex via inline styles instead of precompiled Tailwind classes; each partner got a unique color."
tags: [partners, content-blocks, payload, design-system]
status: active
created: 2026-06-05
updated: 2026-06-05
related: ["[[content-blocks]]", "[[partners-promoted-to-collection]]"]
sources: ["[[2026-06-05-partner-hex-accent-colors-design]]"]
decided: 2026-06-05
supersededBy: ""
---

# Partner accent colors are free hex, carousel tints inline

## Context
`partners.accentColor` was an enum (`primary|accent|blue|emerald|violet|rose`) and the Partners
carousel mapped each key to precompiled Tailwind classes. We wanted arbitrary, per-partner brand
hexes, each unique.

## Decision
`accentColor` is now a hex `text` field with a custom swatch+hex admin component
(`src/components/payload/fields/AccentColorField`). Tailwind can't compile classes for runtime hex,
so `src/blocks/Partners/accent.ts` (`resolveAccent`/`hexToRgba`/`normalizeHex`) turns a hex into
inline-style values (solid + 20%/5%/30% rgba tints), and `Component.client.tsx` applies them via
`style={{}}` (the SVG ring already used a raw color). Invalid/empty falls back to brand gold
`#E4A00B`.

## Data
A migration (`20260605_130000_partner_accent_hex.ts`) converts the enum column to varchar, maps any
enum names to hex, and assigns a curated unique palette **by partner id** (id is stable; partner #8's
live name `Wesele na głowie` differs from the seed's `Wesela`). Per [[migrate-before-next-build]] it
is idempotent and in `ALWAYS_RUN`.

## Consequences
No hard uniqueness constraint — admins pick freely; uniqueness was seeded once. The sign-in logo row
is unaffected (it does not use accentColor).
```

- [ ] **Step 3: Re-stamp the content-blocks zone card**

In `eventizer-mind/map/zones/content-blocks.md`, set `verifiedAt: "<HEAD>"` and add a line noting
`accentColor` is now a hex driving the carousel via `src/blocks/Partners/accent.ts` (see
[[partner-hex-accent-colors]]).

- [ ] **Step 4: Validate the Mind**

Run: `pnpm mind:check`
Expected: passes, 0 errors (the pre-existing auth `enforcedBy` gap is unrelated).

- [ ] **Step 5: Commit**

```bash
git add eventizer-mind/
git commit -m "docs(mind): record partner hex accent decision, re-stamp content-blocks"
```

---

## Self-Review

**Spec coverage:**
- Hex field + swatch component → Tasks 2 + 3. ✓
- Carousel tint from hex (inline styles + `hexToRgba`) → Tasks 1 + 5. ✓
- Migration enum→varchar + palette by id + default + drop enum + `ALWAYS_RUN` → Task 4. ✓
- Unique palette (10 colors, Zielona Lipka kept) → Task 4 Step 1. ✓
- Unit-test pure helpers → Task 1. ✓
- Sign-in row untouched → not modified (correct). ✓
- Mind upkeep (decision + re-stamp + mind:check) → Task 7. ✓

**Placeholder scan:** none — every code/SQL/test step is complete.

**Type consistency:** `resolveAccent(hex)` returns `{ solid, bg, bgSoft, border }` (Task 1) — used
exactly so in Task 5; no `accent.text`/`accent.ringStroke`/`accentMap` remain after Task 5. Field
name `accentColor` ↔ column `accent_color` ↔ migration name `20260605_130000_partner_accent_hex`
match across collection (Task 3), migration, index, and `ALWAYS_RUN` (Task 4).
