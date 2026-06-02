---
type: zone
summary: "The Offers collection: data model, hooks (category resolution, cache revalidation), access rules, drafts/versions."
tags: [offers, payload, data]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[migrate-before-next-build]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: []
  anchors: ["symbol:populateCategoryData", "symbol:resolveCategory"]
  globs:
    - "src/collections/Offers/**"
depends: ["[[media]]", "[[billing]]"]
invariants:
  - rule: "Any Offers field change ships an idempotent migration touching BOTH `offers` and `_offers_v` (version_<field>)."
    enforcedBy: ["[[skill:eventizer-payload-migrations]]"]
verifiedAt: "32f283812d0ecc55e57c5b005fcaaaa2893d06ce"
---

# Offers Data

## Purpose
The Offers collection is Eventizer's core data model. It stores service-provider listings with
title, category (3-level hierarchy), price (single or range), location, media (main image, gallery,
video, background), contact details, and Lexical rich-text description. Payload draft/publish
versioning is enabled (`_offers_v` table). Hooks enforce category resolution, offer limits per
plan, and Next.js cache revalidation on change. Access rules use `offersAccess` factories
(adminOrHigherOrSelf for writes, public for published reads).

## Anchors
- `src/collections/Offers/hooks/populateCategoryData.ts` — `populateCategoryData` `beforeChange`
  hook that resolves the `category` slug-path to `categoryName`/`categorySlug`.
- `src/collections/Offers/hooks/resolveCategory.ts` — `resolveCategory` helper; also heals legacy
  `"Name > Name"` / `"Name → Name"` formats on save.
- `src/collections/Offers/access.ts` — access control factories for the collection.
- `src/collections/Offers/fields.ts` — canonical field definitions.

## Invariants
- Every new field must be migrated in both `offers` and `_offers_v` (draft table). Skipping `_offers_v`
  silently breaks draft writes. Migrations must use `IF NOT EXISTS` / `IF EXISTS` for idempotency.
- Group fields serialize as `<group>_<field>` in SQL; versioned suffix is `version_<group>_<field>`.
