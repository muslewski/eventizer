---
type: zone
summary: "CMS-driven page composition: Payload Pages collection, the block library (Hero, CTA, FeaturedOffers, HowItWorks, etc.), and hero variants."
tags: [cms, blocks, pages]
status: active
created: 2026-06-02
updated: 2026-06-03
related: []
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: ["/[slug]"]
  anchors: []
  globs:
    - "src/blocks/**"
    - "src/collections/Pages/**"
    - "src/collections/Partners.ts"
    - "src/heros/**"
depends: ["[[design-system]]", "[[media]]", "[[offers-data]]"]
invariants: []
verifiedAt: "754e95fbe6f9e9db7697855c1b743b58c207834e"
---

# Content Blocks

## Purpose
CMS-driven page composition for Eventizer's marketing and content pages. The Payload `Pages`
collection powers `[slug]` routes with a flexible block layout. The block library includes:
`ArchiveBlock`, `Banner`, `BetaBanner`, `CallToAction`, `ComingSoon`, `ContactForm`, `Content`,
`FeaturedOffers`, `HowItWorks`, `InstallApp`, `MediaBlock`, `Mission`, `OffersMap`, `Partners`,
`PartnersV2`, `ServiceCategories`, `SocialMedia`, `Video`. Hero variants (`HighImpact`,
`MediumImpact`) are configured separately and rendered by `RenderHero`. `RenderBlocks` dispatches
the correct component per block type. Page-level `revalidatePage` hook triggers Next.js cache
revalidation on Payload save.

The `partners` collection ("Partnerzy Eventizer") holds admin-curated partner content (logo,
name, optional offer link) as a single source of truth. The `PartnersV2` block references it via
a hasMany relationship and renders the picked partners through the **same** carousel client as v1
(`Component.client.tsx`), sharing the `ResolvedPartner` type + `resolvePartners` helper extracted
in `src/blocks/Partners/shared.ts`. v1 (`Partners`, inline per-page array) and v2 (`PartnersV2`,
collection-backed) coexist — see [[partners-promoted-to-collection]].

## Anchors
- `src/blocks/` — all block components and configs.
- `src/collections/Pages/` — Pages collection definition and hooks.
- `src/heros/` — hero variants (`HighImpact`, `MediumImpact`, `RenderHero`).

## Invariants
- Every new block must export both a `Component` (server) and a Payload `config` (block definition)
  and be registered in `RenderBlocks`.
- Hero and block components must respect the `reduce-motion` class for animation accessibility.
