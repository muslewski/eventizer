---
type: zone
summary: "CMS-driven page composition: Payload Pages collection, the block library (Hero, CTA, FeaturedOffers, HowItWorks, etc.), and hero variants."
tags: [cms, blocks, pages]
status: active
created: 2026-06-02
updated: 2026-06-02
related: []
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: ["/[slug]"]
  anchors: []
  globs:
    - "src/blocks/**"
    - "src/collections/Pages/**"
    - "src/heros/**"
depends: ["[[design-system]]", "[[media]]"]
invariants: []
verifiedAt: "32f283812d0ecc55e57c5b005fcaaaa2893d06ce"
---

# Content Blocks

## Purpose
CMS-driven page composition for Eventizer's marketing and content pages. The Payload `Pages`
collection powers `[slug]` routes with a flexible block layout. The block library includes:
`ArchiveBlock`, `Banner`, `BetaBanner`, `CallToAction`, `ComingSoon`, `ContactForm`, `Content`,
`FeaturedOffers`, `HowItWorks`, `InstallApp`, `MediaBlock`, `Mission`, `OffersMap`, `Partners`,
`ServiceCategories`, `SocialMedia`, `Video`. Hero variants (`HighImpact`, `MediumImpact`) are
configured separately and rendered by `RenderHero`. `RenderBlocks` dispatches the correct
component per block type. Page-level `revalidatePage` hook triggers Next.js cache revalidation
on Payload save.

## Anchors
- `src/blocks/` — all block components and configs.
- `src/collections/Pages/` — Pages collection definition and hooks.
- `src/heros/` — hero variants (`HighImpact`, `MediumImpact`, `RenderHero`).

## Invariants
- Every new block must export both a `Component` (server) and a Payload `config` (block definition)
  and be registered in `RenderBlocks`.
- Hero and block components must respect the `reduce-motion` class for animation accessibility.
