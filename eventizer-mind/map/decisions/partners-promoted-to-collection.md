---
type: decision
summary: "Partners were promoted from an inline block array to a dedicated `partners` collection, referenced by a new `partnersV2` block via a hasMany relationship (FeaturedOffers pattern)."
tags: [cms, blocks, partners, payload]
status: active
created: 2026-06-03
updated: 2026-06-03
related: ["[[content-blocks]]", "[[offers-data]]"]
sources: ["[[2026-06-03-partners-collection-design]]"]
decided: 2026-06-03
supersededBy: ""
---

# Partners promoted to a collection, referenced by `partnersV2`

## Context
The original `Partners` block stored each partner (logo, name, optional offer link) as an inline
array on the block instance. Every Page document that wanted to show partners had to re-enter the
same partner list by hand. That list is identical across pages (the homepage roster), so the
inline model duplicated content, was tedious to maintain, and drifted out of sync as pages were
edited independently.

## Decision
Partners are promoted to a dedicated Payload `partners` collection ("Partnerzy Eventizer",
`src/collections/Partners.ts`) — the single source of truth for partner content. A new
`partnersV2` block (`src/blocks/PartnersV2/`) references that collection via a hasMany
relationship, picking which partners to display per page (the FeaturedOffers pattern: a curated
selection from a collection rather than inline data).

## Why
A collection gives one editable record per partner, reused across any number of pages. Editing a
logo or offer link once updates everywhere the partner appears, eliminating the re-entry and drift
inherent to the inline array.

## Why v1 + v2 coexist
The rollout is **additive**. No Page documents were edited, and the v1 `Partners` block stays
registered in `src/blocks/RenderBlocks.tsx` + `src/collections/Pages/index.ts`, so existing pages
keep rendering exactly as before. The `partnersV2` block is added to pages manually. v1 can be
tombstoned later once every page has migrated to v2; until then both block types remain valid.

## Reuse note
v2 introduces **zero UI duplication**. The carousel client (`Component.client.tsx`) is shared, and
the resolution logic was extracted into `src/blocks/Partners/shared.ts` as the `ResolvedPartner`
type + `toResolvedPartner` + `resolvePartners` helper. v1's `Component.tsx` was refactored to use
the same helper, so both blocks normalize their (inline vs. collection-backed) data into the same
shape before handing it to the one carousel component.

## Seed note
The 10 existing homepage partners were seeded into the collection via a local-API migration
(`src/migrations/20260603_120500_seed_partners.ts`), separate from the schema migration that
creates the collection + v2 block. The seed auto-links each partner to its offer by matching the
offer's stable `link` slug, so the relationships survive without hard-coded IDs.

## Consequences
Any future partner content lives in the `partners` collection, edited once. New pages should use
`partnersV2` and pick from the collection; the v1 inline `Partners` block is retained only for
backward compatibility and should not be added to new pages. Schema and seed changes to partners
follow the standard migration discipline (see [[migrate-before-next-build]]).
