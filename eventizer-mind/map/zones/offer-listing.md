---
type: zone
summary: "Public offer browsing: ogloszenia list/hero views, search + filters (Polish params), category & event-type strips, offers map, featured carousel."
tags: [offers, public, search]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[polish-url-param-names]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: ["/ogloszenia"]
  anchors: []
  globs:
    - "src/app/(frontend)/[lang]/ogloszenia/**"
    - "src/blocks/OffersMap/**"
    - "src/blocks/FeaturedOffers/**"
depends: ["[[offers-data]]", "[[design-system]]"]
invariants:
  - rule: "The two-phase fetch (filter-then-hydrate) for in-memory sort/geo paths preserves correct result hydration."
    enforcedBy: ["[[test:offersQueryHydration.int]]"]
verifiedAt: "daea2b0356b98740c53ae4a5ceaf8f93b1a05bf9"
---

# Offer Listing

## Purpose
The public-facing offer discovery surface at `/ogloszenia`. Includes a `HeroView` (featured
banner), a `ListView` with paginated offer cards, a category-selection strip, and an event-type
filter strip. URL query params follow Polish naming: `strona` (page), `filtr` (filter), `q`
(search query). `OffersMap` block renders offers geographically; `FeaturedOffers` block drives the
homepage carousel. Two-phase fetch is used for in-memory sort/geo paths: a first query filters
offers, a second hydrates the full data for the filtered IDs, preserving correct ordering and
relation depth.

## Anchors
- `src/app/(frontend)/[lang]/ogloszenia/` — route tree (ListView, HeroView, slug detail).
- `src/app/(frontend)/[lang]/ogloszenia/[slug]/` — offer detail page (OfferHero, OfferDetails,
  EventTypeChips, contact form). `generateMetadata` here drives the offer's social preview →
  [[social-link-previews]].
- `src/blocks/OffersMap/` — map block with Leaflet client component.
- `src/blocks/FeaturedOffers/` — featured-offers carousel block.

The detail page's "Rodzaje eventów" card (`EventTypeChips`) renders one chip per applicable event
type. When an offer applies to every type it shows the full active list — no separate "wszystkie"
badge, since the complete set already conveys "all".

## Invariants
- URL params must use Polish keys (`strona`, `filtr`, `q`) — English equivalents break links shared
  via email or Stripe redirects.
- Two-phase fetch must re-hydrate from the filtered ID list, not re-query with a separate filter,
  to avoid ordering/result-set drift between the two calls.
