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

## Scope
- The legacy v1 `Partners` inline block keeps its own enum `accentColor` field, but it is **not**
  registered in the Pages block list (only `PartnersV2` is), so it is dormant — its enum strings
  simply fall back to the gold default through the shared client. Not converted (YAGNI).
- The sign-in "Zaufali nam najlepsi" logo row does not use `accentColor` and is unaffected.

## Consequences
No hard uniqueness constraint — admins pick freely; uniqueness was seeded once.
