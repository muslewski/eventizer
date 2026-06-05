---
type: spec
summary: "Replace the partners collection's fixed accentColor enum with a free hex color (swatch + hex custom field), drive the Partners v1/v2 carousel tint from the hex via inline styles, and assign each existing partner a unique color (keeping Zielona Lipka's green)."
tags: [partners, content-blocks, design-system]
status: draft
created: 2026-06-05
related: ["[[content-blocks]]", "[[partners-promoted-to-collection]]"]
---

# Partner hex accent colors

## Problem

The `partners` collection's `accentColor` is a fixed enum (`primary | accent | blue | emerald |
violet | rose`), and the Partners carousel maps each key to **precompiled Tailwind classes**
(`bg-primary/20`, `text-primary`, `border-primary/30`) plus a raw `ringStroke`. We want partners to
carry an arbitrary brand hex, each one distinct, and have the carousel tint from it. The current 10
partners also share colors (blue×2, emerald×2, rose×2, accent×2) — not unique.

## Goals

1. Admins set a partner's color as a hex (`#RRGGBB`) via a swatch + hex input.
2. The Partners carousel (v1 + v2, shared client) tints from the hex.
3. Each of the 10 existing partners gets a unique color, keeping Zielona Lipka's green.

## Non-goals

- The sign-in "Zaufali nam najlepsi" logo row — it does not use `accentColor` (logos on white
  circles). Untouched.
- A hard DB/validation uniqueness constraint across partners. Unique values are assigned now;
  admins may pick freely (including repeats) afterward.
- Named-preset quick-picks. The field is freeform hex only.

## Design

### 1. Field: `accentColor` → hex text + swatch component

In `src/collections/Partners.ts`, change `accentColor` from `type: 'select'` to `type: 'text'`:

- `defaultValue: '#E4A00B'` (brand gold — keeps new/logo-less partners branded).
- `validate`: must match `/^#([0-9a-fA-F]{6})$/` (allow empty → falls back to default at render).
- `label`: `{ en: 'Accent color', pl: 'Kolor akcentu' }`.
- `admin.components.Field`: a custom client component rendering a native color swatch
  (`<input type="color">`) and a text input, both bound to the field value via Payload's
  `useField`. Typing a valid hex updates the swatch and vice-versa.

The custom field component lives at `src/components/payload/fields/AccentColorField/index.tsx` (a
`'use client'` component) and is registered in Payload's import map (`pnpm payload generate:importmap`
after referencing it by `'/components/payload/fields/AccentColorField#AccentColorField'`, matching
how existing custom admin components in `src/components/payload/**` are wired).

### 2. Rendering: hex-driven inline styles

`src/blocks/Partners/Component.client.tsx` currently has an `accentMap` (Tailwind class strings) +
`resolveAccent(key)`. Tailwind cannot compile classes for runtime hex, so:

- Add a pure helper `hexToRgba(hex: string, alpha: number): string` — parses `#RRGGBB` to
  `rgba(r, g, b, alpha)`. Add `normalizeHex(hex?: string | null): string` returning a valid
  `#RRGGBB` or the `#E4A00B` default.
- Replace `accentMap` + `resolveAccent` with a new `resolveAccent(hex?: string | null)` returning:
  ```ts
  { solid: string;  // the hex — text color + SVG ring stroke
    bg: string;      // hexToRgba(hex, 0.20)
    bgSoft: string;  // hexToRgba(hex, 0.05)
    border: string } // hexToRgba(hex, 0.30)
  ```
- Convert every accent usage from `className={accent.bg}` to `style={{ ... }}`:
  - Glow (`activeAccent.bgSoft`) → `style={{ backgroundColor: activeAccent.bgSoft }}`.
  - Avatar container → `style={{ backgroundColor: isActive ? accent.bg : accent.bgSoft, borderColor: isActive ? accent.border : undefined }}` (keep the `border-border/20` class for the inactive border).
  - Placeholder sweep span → `style={{ backgroundColor: isActive ? accent.bg : accent.bgSoft }}` (drop the redundant gradient-from/via classes it overrode).
  - Initial letter (`accent.text`) → `style={{ color: accent.solid }}`, keep the `opacity-60` class when inactive.
  - SVG ring `stroke={accent.ringStroke}` → `stroke={accent.solid}`.
  - Spotlight `<h3>` (`activeAccent.text`) → `style={{ color: activeAccent.solid }}`.
  - Bottom-strip active mark (`accent.text`) → `style={{ color: accent.solid }}`, keep muted class when inactive.

`ResolvedPartner.accentColor` / `RawPartner.accentColor` in `src/blocks/Partners/shared.ts` stay
`string | null` (now a hex) — no shape change.

### 3. Migration

`partners` is not versioned (no `_v` mirror). One migration
(`src/migrations/20260605_HHMMSS_partner_accent_hex.ts`), idempotent, added to `ALWAYS_RUN` in
`scripts/prepare-migrations.mjs`:

```sql
ALTER TABLE "partners" ALTER COLUMN "accent_color" DROP DEFAULT;
ALTER TABLE "partners" ALTER COLUMN "accent_color" TYPE varchar USING "accent_color"::text;
-- baseline: any remaining enum-name values → hex (covers non-seeded rows)
UPDATE "partners" SET "accent_color" = CASE "accent_color"
  WHEN 'primary' THEN '#0B0B0B' WHEN 'accent' THEN '#E4A00B'
  WHEN 'blue' THEN '#3B82F6'    WHEN 'emerald' THEN '#10B981'
  WHEN 'violet' THEN '#8B5CF6'  WHEN 'rose' THEN '#F43F5E'
  ELSE "accent_color" END
WHERE "accent_color" !~ '^#';
-- curated unique palette, keyed by stable partner id (names carry Polish chars and
-- one was renamed in admin — Wesele/Wesela — so id is the reliable key here).
UPDATE "partners" SET "accent_color" = '#0B0B0B' WHERE "id" = 1;  -- SkyClub Białystok
UPDATE "partners" SET "accent_color" = '#3B82F6' WHERE "id" = 2;  -- Meetly
UPDATE "partners" SET "accent_color" = '#10B981' WHERE "id" = 3;  -- Apartamenty Zielona Lipka (kept)
UPDATE "partners" SET "accent_color" = '#8B5CF6' WHERE "id" = 4;  -- Apartamenty pod Gromadzyniem
UPDATE "partners" SET "accent_color" = '#F43F5E' WHERE "id" = 5;  -- Princess Palace Gdańsk
UPDATE "partners" SET "accent_color" = '#E4A00B' WHERE "id" = 6;  -- DJ SPDR
UPDATE "partners" SET "accent_color" = '#F97316' WHERE "id" = 7;  -- Misiak Events
UPDATE "partners" SET "accent_color" = '#EC4899' WHERE "id" = 8;  -- Wesele na głowie
UPDATE "partners" SET "accent_color" = '#14B8A6' WHERE "id" = 9;  -- Santiago Events
UPDATE "partners" SET "accent_color" = '#6366F1' WHERE "id" = 10; -- Na Łośmiu Metrach
ALTER TABLE "partners" ALTER COLUMN "accent_color" SET DEFAULT '#E4A00B';
DROP TYPE IF EXISTS "enum_partners_accent_color";
```

Keying the palette on `id` (verified against the live DB: 1–10 in the order above) avoids the
name-spelling pitfall — partner #8's live name is `Wesele na głowie`, while the seed migration
wrote `Wesela`. The baseline CASE above (keyed on the enum string) still covers any non-hex value
generically. The `down` only resets the default to NULL and is documented as non-restoring (the
enum→hex value conversion is lossy and not reversed).

### The palette (each unique)

| Partner | Hex |
| --- | --- |
| SkyClub Białystok | `#0B0B0B` |
| Meetly | `#3B82F6` |
| Apartamenty Zielona Lipka | `#10B981` (kept) |
| Apartamenty pod Gromadzyniem | `#8B5CF6` |
| Princess Palace Gdańsk | `#F43F5E` |
| DJ SPDR | `#E4A00B` |
| Misiak Events | `#F97316` |
| Wesele na głowie | `#EC4899` |
| Santiago Events | `#14B8A6` |
| Na Łośmiu Metrach | `#6366F1` |

## Testing / verification

- `pnpm generate:types` — `Partner.accentColor` stays `string | null`.
- `pnpm payload migrate` applies cleanly; partners show the hexes above.
- Unit-test `hexToRgba` / `normalizeHex` (pure functions): valid hex → correct rgba, `#fff`/empty/
  garbage → default; this is the one genuinely unit-testable unit.
- Manual: open the Partners carousel — each partner's avatar tint, spotlight name, ring, and strip
  mark render in its assigned color; the admin field shows a working swatch.
- Prod build runs the migration without enum/column errors.

## Risks

- **Import-map registration**: a custom admin field component must be in Payload's generated import
  map or the admin field won't render — the plan runs `generate:importmap` and verifies.
- **Migration on prod**: forgetting `ALWAYS_RUN` → column stays enum on prod → build/admin breaks.
  In-scope and called out.
- Black (`#0B0B0B`) glow/tint at 5–20% alpha is very subtle on dark backgrounds — acceptable
  (SkyClub is intentionally near-black); revisit only if it reads as no-accent.
