# Code Quality & Performance Optimization Design

**Date:** 2026-03-22
**Goal:** Fix bad conventions, missing image optimizations, unnecessary client boundaries, and large file structure across blocks, offer listing, and offer page components.
**Constraint:** No behavior changes — all fixes are refactors, additions, or splits.

---

## Problem

Analysis of blocks (`src/blocks/`), offer listing (`ogloszenia/ListView/`), and offer page (`ogloszenia/[slug]/components/`) revealed:
- 7+ images missing `sizes` prop (causes oversized srcset generation)
- Static arrays/objects recreated on every render in 3+ components
- Duplicate `getIconUrl` function in ServiceCategories
- Components marked `use client` that are purely presentational (3 files)
- OfferListCard and offer page children not memoized (unnecessary re-renders)
- queryBuilder.ts at 455 lines mixing distance, conditions, and search logic
- Duplicate reverse geocoding in LocationSearch and ActiveFilters
- Missing error states on OfferVideo and OfferMap

---

## Section 1: Image Optimization

Add responsive `sizes` prop to all `next/image` components using `fill` that lack it:

| File | Component | Suggested sizes |
|---|---|---|
| `ListView/OffersView/OfferListCard/index.tsx` | Offer card image | `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw` |
| `blocks/BetaBanner/Component.client.tsx` | FloatingBadge image | `48px` (fixed size badge) |
| `blocks/HowItWorks/HowItWorksCard/index.tsx` | Background card image | `(max-width: 768px) 100vw, 50vw` |
| `blocks/ServiceCategories/Component.client.tsx` | Category icons in drawer | `48px` |
| `blocks/ServiceCategories/CategoryCard/index.tsx` | Category card icon | `48px` |
| `blocks/MediaBlock/Component.tsx` | Media block image | `100vw` |
| `ogloszenia/[slug]/components/OfferShortInfo/index.tsx` | Offer short info image | `(max-width: 640px) 96px, 240px` |

Remove `unoptimized` prop from OrbitVisualization logo images (`src/blocks/Mission/OrbitVisualization.tsx`) — let Next.js optimize instead of serving raw PNGs.

---

## Section 2: Constant Extraction & Memoization

### Move static data to module scope

- **ContactForm** (`src/blocks/ContactForm/Component.client.tsx`): Move `typeCards` array and `messagePlaceholders` object outside the component function.
- **SocialMedia block** (`src/blocks/SocialMedia/Component.client.tsx`): Move `platforms` array outside the component function.

### Extract shared utility

- **ServiceCategories**: Extract `getIconUrl` from both `Component.client.tsx` and `CategoryCard/index.tsx` into a shared utility (e.g., `src/blocks/ServiceCategories/utils.ts`).

### Add React.memo()

- **OfferListCard** (`ListView/OffersView/OfferListCard/index.tsx`): Wrap exported component with `React.memo()`.
- **ContactDetails** (`ogloszenia/[slug]/components/ContactInfo/ContactDetails.tsx`): Wrap with `React.memo()`.
- **SocialMedia** (`ogloszenia/[slug]/components/ContactInfo/SocialMedia.tsx`): Wrap with `React.memo()`.
- **InfoRow** (`ogloszenia/[slug]/components/OfferDetails/index.tsx`): Wrap the sub-component with `React.memo()`.

---

## Section 3: Remove Unnecessary `use client`

Remove `'use client'` directive from components that have no hooks, state, or browser APIs:

- `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/ContactInfo/ContactDetails.tsx` — purely presentational
- `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/ContactInfo/SocialMedia.tsx` — purely presentational
- `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferGallery/index.tsx` — uses `useMemo` that can be replaced with inline computation

Note: OfferShortInfo stays as `use client` because it uses `motion` from `motion/react`.

When removing `use client` from OfferGallery, replace the `useMemo` with a plain `const` computation since server components don't need memoization.

---

## Section 4: Split queryBuilder.ts

Split `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/queryBuilder.ts` (455 lines) into:

- **`queryBuilder.ts`** — main `queryOffers` entry point, imports from the other modules
- **`distance.ts`** — `getBoundingBox`, `haversineDistance`, `filterByDistance`
- **`conditions.ts`** — `buildBaseConditions`, `buildPriceConditions`, `buildSearchWhere`

All existing exports remain available. The main `queryBuilder.ts` re-exports anything needed by consumers.

---

## Section 5: Extract useReverseGeocode Hook

Both `LocationSearch` and `ActiveFilters` independently call Google's reverse geocoding for the same coordinates. Extract into a shared hook:

Create `src/app/(frontend)/[lang]/ogloszenia/ListView/hooks/useReverseGeocode.ts`:
- Takes `{ lat, lng }` and `isLoaded` (from Google Maps context)
- Returns `{ locationName, isLoading }`
- Caches result for same coordinates

Update both `LocationSearch` and `ActiveFilters` to use this hook instead of their inline geocoding logic.

---

## Section 6: Error States

### OfferVideo
Add `onError` handler on the `<video>` element. When video fails to load, set an error state and render a fallback message (e.g., "Nie udało się załadować wideo" with a retry option).

### OfferMap
Add error handling around Google Maps initialization. If `isLoaded` remains false after a timeout (e.g., 10 seconds), or if map instantiation throws, show an error message instead of an infinite spinner.

---

## Testing Strategy

1. **Visual regression**: Verify all pages render identically before and after changes
2. **Build verification**: `pnpm build` after each task
3. **Image check**: Verify `sizes` attributes appear in rendered HTML via DevTools
4. **Console check**: No new warnings or errors in browser console
5. **Memo verification**: Use React DevTools Profiler to confirm memoized components skip re-renders
