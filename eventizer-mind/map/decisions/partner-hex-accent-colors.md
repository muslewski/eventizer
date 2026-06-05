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

## v1 → v2 migration (home + o-nas)
The live `home` and `o-nas` pages were still using the legacy v1 `Partners` block (an inline partner
array with the OLD enum colors and no logos), not the collection. So two follow-ups were needed to
actually surface the unique palette + logos:
1. `normalizeHex` maps legacy enum names (`primary`→`#0B0B0B`, `blue`→`#3B82F6`, …) to hex, so the
   shared carousel renders both v2 hex values and any remaining v1 enum strings (prevents an
   all-gold regression on pages still on v1).
2. Migration `20260605_140000_partners_v1_to_v2_home_onas.ts` switches both pages' carousels to the
   collection-backed `partnersV2` block (local API; maps inline partner order → collection ids by
   name; carries badge/heading/description/rotationSeconds; fail-safe per page). Now the homepage
   carousel shows the unique hex palette AND the uploaded partner logos from the collection.

## Carousel prefers initials (DISABLE_LOGO)
`Component.client.tsx` has a `DISABLE_LOGO = true` toggle that forces the stylized first-letter
avatars instead of partner logos in the carousel — we preferred the initials look. The logo upload
+ resolution stays wired (flip to `false` to use logos). The sign-in "Zaufali nam najlepsi" row is a
separate component (`TrustedPartners`) and still shows logos.

## Scope
- The sign-in "Zaufali nam najlepsi" logo row does not use `accentColor` and is unaffected.
- The v1 `Partners` block remains registered for backward-compat but is no longer used by home/o-nas.

## Consequences
No hard uniqueness constraint — admins pick freely; uniqueness was seeded once. The partners
collection is now the single source for the carousel on home + o-nas (edit once).
