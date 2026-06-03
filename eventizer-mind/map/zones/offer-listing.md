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
verifiedAt: "1db73c9353edf0e380482bef51e4514798ed28e0"
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
- `src/blocks/OffersMap/` — map block with Leaflet client component.
- `src/blocks/FeaturedOffers/` — featured-offers carousel block.

## Invariants
- URL params must use Polish keys (`strona`, `filtr`, `q`) — English equivalents break links shared
  via email or Stripe redirects.
- Two-phase fetch must re-hydrate from the filtered ID list, not re-query with a separate filter,
  to avoid ordering/result-set drift between the two calls.
