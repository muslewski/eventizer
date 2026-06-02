# Code Quality & Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix image optimization, extract constants, add memoization, remove unnecessary `use client`, split queryBuilder, extract shared hook, and add error states.

**Architecture:** All changes are independent refactors with no behavior changes. Each task can be implemented and committed separately. Tasks are ordered from simplest (image props) to most complex (file splits, hook extraction).

**Tech Stack:** Next.js 16, React 19, next/image, Payload CMS

**Spec:** `docs/superpowers/specs/2026-03-22-code-quality-optimization-design.md`

---

## Task 1: Add `sizes` Prop to Images

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard/index.tsx`
- Modify: `src/blocks/HowItWorks/HowItWorksCard/index.tsx`
- Modify: `src/blocks/ServiceCategories/Component.client.tsx`
- Modify: `src/blocks/ServiceCategories/CategoryCard/index.tsx`

- [ ] **Step 1: Add sizes to OfferListCard**

Read `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard/index.tsx`. Find the `<Image` component with `fill` prop. Add `sizes` prop:

```tsx
<Image
  src={imageUrl}
  alt={title}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  // ... rest of existing props
/>
```

- [ ] **Step 2: Add sizes to HowItWorksCard**

Read `src/blocks/HowItWorks/HowItWorksCard/index.tsx`. Find the background `<Image` with `fill`. Add:

```tsx
sizes="(max-width: 768px) 100vw, 50vw"
```

- [ ] **Step 3: Add sizes to ServiceCategories Component.client.tsx**

Read `src/blocks/ServiceCategories/Component.client.tsx`. Find the Image components for category icons (in the drawer). They're small icons — add:

```tsx
sizes="48px"
```

- [ ] **Step 4: Add sizes to CategoryCard**

Read `src/blocks/ServiceCategories/CategoryCard/index.tsx`. Find the Image component. Add:

```tsx
sizes="48px"
```

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds with no new warnings.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "perf: add sizes prop to images missing responsive sizes"
```

---

## Task 2: Remove `unoptimized` from OrbitVisualization

**Files:**
- Modify: `src/blocks/Mission/OrbitVisualization.tsx`

- [ ] **Step 1: Remove unoptimized props**

Read `src/blocks/Mission/OrbitVisualization.tsx`. Find the two Image components (around lines 121-132). Remove `unoptimized` from both:

```tsx
// FROM:
<Image
  src={eventizerLogoLight}
  alt="Eventizer"
  className="w-full h-full object-contain dark:hidden"
  unoptimized
/>

// TO:
<Image
  src={eventizerLogoLight}
  alt="Eventizer"
  className="w-full h-full object-contain dark:hidden"
/>
```

Same for the dark variant.

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/blocks/Mission/OrbitVisualization.tsx
git commit -m "perf: remove unoptimized prop from OrbitVisualization logos"
```

---

## Task 3: Extract Constants to Module Scope

**Files:**
- Modify: `src/blocks/ContactForm/Component.client.tsx`
- Modify: `src/blocks/SocialMedia/Component.client.tsx`

- [ ] **Step 1: Move ContactForm constants outside component**

Read `src/blocks/ContactForm/Component.client.tsx`. Find `typeCards` (around line 91) and `messagePlaceholders` (around line 101). These are inside the component function. Move them outside:

The `typeCards` array references `organizationLabel` which is a prop — so it CAN'T be moved outside as-is. Instead, only move `messagePlaceholders` which is truly static. For `typeCards`, use `useMemo` with `organizationLabel` as dependency.

```tsx
// Move OUTSIDE component:
const MESSAGE_PLACEHOLDERS: Record<string, string> = {
  organization: '...',
  question: '...',
  'service-problem': '...',
}

// Inside component, memoize typeCards:
const typeCards = useMemo<TypeCard[]>(() => [
  { value: 'organization', label: organizationLabel ?? 'Organizacja eventu', icon: CalendarDays },
  { value: 'question', label: 'Zadaj pytanie', icon: HelpCircle },
  { value: 'service-problem', label: 'Problem z serwisem', icon: Wrench },
], [organizationLabel])
```

- [ ] **Step 2: Move SocialMedia platforms outside component**

Read `src/blocks/SocialMedia/Component.client.tsx`. Find `platforms` array (around line 74). This array references destructured props (`instagram`, `facebook`, etc.) so it CAN'T be fully moved outside. Extract the static parts:

Move the static config (icons, names, gradients, shadow colors) outside the component as a constant. Keep the dynamic `data` mapping inside.

```tsx
// OUTSIDE component:
const PLATFORM_CONFIG = [
  { key: 'instagram', icon: FaInstagram, name: 'Instagram', gradient: '...', shadowColor: '...' },
  { key: 'facebook', icon: FaFacebook, name: 'Facebook', gradient: '...', shadowColor: '...' },
  { key: 'tiktok', icon: FaTiktok, name: 'TikTok', gradient: '...', shadowColor: '...' },
  { key: 'twitter', icon: FaXTwitter, name: 'X', gradient: '...', shadowColor: '...' },
] as const

// INSIDE component:
const platforms = useMemo(() =>
  PLATFORM_CONFIG.map(config => ({
    ...config,
    data: props[config.key as keyof typeof props],
  })),
  [instagram, facebook, tiktok, twitter]
)
```

Read the actual file to get the exact gradient and shadowColor values.

- [ ] **Step 3: Verify build**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/blocks/ContactForm/Component.client.tsx src/blocks/SocialMedia/Component.client.tsx
git commit -m "perf: extract static constants to module scope"
```

---

## Task 4: Extract Shared getIconUrl Utility

**Files:**
- Create: `src/blocks/ServiceCategories/utils.ts`
- Modify: `src/blocks/ServiceCategories/Component.client.tsx`
- Modify: `src/blocks/ServiceCategories/CategoryCard/index.tsx`

- [ ] **Step 1: Create shared utility**

```tsx
// src/blocks/ServiceCategories/utils.ts
import type { Media } from '@/payload-types'

export const getIconUrl = (icon: (number | null) | Media | undefined): string | null => {
  if (!icon || typeof icon === 'number') return null
  return icon.url || null
}
```

- [ ] **Step 2: Update Component.client.tsx**

Remove the local `getIconUrl` function (around lines 66-69). Add import:

```tsx
import { getIconUrl } from '@/blocks/ServiceCategories/utils'
```

- [ ] **Step 3: Update CategoryCard**

Remove the local `getIconUrl` function (around lines 36-39). Add import:

```tsx
import { getIconUrl } from '@/blocks/ServiceCategories/utils'
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`

- [ ] **Step 5: Commit**

```bash
git add src/blocks/ServiceCategories/
git commit -m "refactor: extract shared getIconUrl utility for ServiceCategories"
```

---

## Task 5: Add React.memo to Key Components

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard/index.tsx`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/ContactInfo/ContactDetails.tsx`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx`

- [ ] **Step 1: Memo OfferListCard**

Read `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard/index.tsx`. Find the export. Wrap with React.memo:

```tsx
// If currently: export default function OfferListCard(props) { ... }
// Change to:
function OfferListCard(props: OfferListCardProps) { ... }
export default React.memo(OfferListCard)
```

Or if it's an arrow function default export, convert to named + memo wrapper.

- [ ] **Step 2: Memo ContactDetails**

Read `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/ContactInfo/ContactDetails.tsx`. Wrap with React.memo. Note: this file is `use client` — memo works in client components.

- [ ] **Step 3: Memo InfoRow**

Read `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx`. Find the `InfoRow` sub-component (around line 18). Wrap with React.memo:

```tsx
const InfoRow = React.memo(function InfoRow({ ... }: InfoRowProps) {
  // existing body
})
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "perf: add React.memo to OfferListCard, ContactDetails, InfoRow"
```

Note: SocialMedia on offer page is already a server component (not `use client`), so `React.memo` is not applicable there.

---

## Task 6: Remove Unnecessary `use client`

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/ContactInfo/ContactDetails.tsx`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferGallery/index.tsx`

- [ ] **Step 1: Remove use client from ContactDetails**

Read the file. Remove the `'use client'` directive on line 1. Verify the component has no hooks (useState, useEffect, etc.) or browser APIs. If it does have hooks, STOP and skip this file.

Note: If we added React.memo in Task 5, we need to check if React.memo works in server components. It does — React.memo is supported in both client and server components.

- [ ] **Step 2: Remove use client from OfferGallery**

Read `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferGallery/index.tsx`. Remove `'use client'` on line 1. Replace `useMemo` with a plain `const`:

```tsx
// FROM:
const slides: CarouselSlide[] = useMemo(() => {
  // ... mapping logic
}, [offer.gallery, offer.title])

// TO:
const slides: CarouselSlide[] = (() => {
  // ... same mapping logic, no useMemo wrapper
})()
```

Also remove `useMemo` from the imports.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds. If errors about client-only APIs, revert and skip.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove unnecessary use client from ContactDetails and OfferGallery"
```

Note: SocialMedia on offer page was found to already NOT have `use client` — no change needed.

---

## Task 7: Split queryBuilder.ts

**Files:**
- Create: `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/distance.ts`
- Create: `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/conditions.ts`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/queryBuilder.ts`

- [ ] **Step 1: Create distance.ts**

Read `queryBuilder.ts` fully. Extract these functions into `distance.ts`:
- `getBoundingBox` (around lines 10-19)
- `haversineDistance` (around lines 24-40)
- `filterByDistance` (around lines 184-201)

Include necessary imports (types from Payload, etc.). Export all functions.

- [ ] **Step 2: Create conditions.ts**

Extract these functions into `conditions.ts`:
- `buildBaseConditions` (around lines 45-78)
- `buildPriceConditions` (around lines 84-118)
- `buildSearchWhere` (around lines 123-142)

Include necessary imports. Export all functions.

- [ ] **Step 3: Update queryBuilder.ts**

Replace the extracted function definitions with imports:

```tsx
import { getBoundingBox, haversineDistance, filterByDistance } from './distance'
import { buildBaseConditions, buildPriceConditions, buildSearchWhere } from './conditions'
```

Keep in queryBuilder.ts:
- `calculatePagination`
- `deduplicateOffers`
- `queryWithSearch`
- `queryWithoutSearch`
- `queryOffers` (main entry)
- `queryWithGeoFilter`

- [ ] **Step 4: Verify all existing imports still work**

Check if any other file imports from queryBuilder.ts. Run:
```bash
grep -r "from.*queryBuilder" src/ --include="*.ts" --include="*.tsx"
```
If other files import specific functions that moved, update those imports or add re-exports to queryBuilder.ts.

- [ ] **Step 5: Verify build**

Run: `pnpm build`

- [ ] **Step 6: Commit**

```bash
git add src/app/(frontend)/[lang]/ogloszenia/ListView/utils/
git commit -m "refactor: split queryBuilder into distance.ts and conditions.ts"
```

---

## Task 8: Extract useReverseGeocode Hook

**Files:**
- Create: `src/app/(frontend)/[lang]/ogloszenia/ListView/hooks/useReverseGeocode.ts`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Settings/LocationSearch/index.tsx`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/ActiveFilters/index.tsx`

- [ ] **Step 1: Create the shared hook**

```tsx
// src/app/(frontend)/[lang]/ogloszenia/ListView/hooks/useReverseGeocode.ts
'use client'

import { useState, useEffect, useRef } from 'react'

interface UseReverseGeocodeProps {
  lat: number | null | undefined
  lng: number | null | undefined
  isLoaded: boolean
}

interface UseReverseGeocodeResult {
  locationName: string | null
  isLoading: boolean
}

export function useReverseGeocode({ lat, lng, isLoaded }: UseReverseGeocodeProps): UseReverseGeocodeResult {
  const [locationName, setLocationName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!lat || !lng || !isLoaded) {
      setLocationName(null)
      return
    }

    const coordsKey = `${lat},${lng}`

    // Return cached result
    const cached = cacheRef.current.get(coordsKey)
    if (cached) {
      setLocationName(cached)
      return
    }

    setIsLoading(true)
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const locality = results.find((r) => r.types.includes('locality'))
        const name = locality ? locality.formatted_address : results[0].formatted_address
        const shortName = name.split(',')[0]
        cacheRef.current.set(coordsKey, shortName)
        setLocationName(shortName)
      }
      setIsLoading(false)
    })
  }, [lat, lng, isLoaded])

  return { locationName, isLoading }
}
```

- [ ] **Step 2: Update LocationSearch to use the hook**

Read `LocationSearch/index.tsx`. Find the reverse geocoding useEffect (around lines 66-90). Replace it with:

```tsx
import { useReverseGeocode } from '@/app/(frontend)/[lang]/ogloszenia/ListView/hooks/useReverseGeocode'

// Replace the reverse geocoding useEffect with:
const { locationName: reverseGeocodedName } = useReverseGeocode({
  lat: currentLat,
  lng: currentLng,
  isLoaded,
})

// Use reverseGeocodedName to set selectedLocation when needed
useEffect(() => {
  if (reverseGeocodedName && !selectedLocation && !isClearingRef.current) {
    setSelectedLocation(reverseGeocodedName)
  }
}, [reverseGeocodedName, selectedLocation])
```

Remove the old geocoding useEffect entirely.

- [ ] **Step 3: Update ActiveFilters to use the hook**

Read `ActiveFilters/index.tsx`. Find the reverse geocoding useEffect (around lines 42-68). Replace with:

```tsx
import { useReverseGeocode } from '@/app/(frontend)/[lang]/ogloszenia/ListView/hooks/useReverseGeocode'

const { locationName } = useReverseGeocode({
  lat: currentLat,
  lng: currentLng,
  isLoaded,
})
```

Remove the old geocoding useEffect, `prevCoordsRef`, and the local `locationName` state (use the one from the hook).

- [ ] **Step 4: Verify build**

Run: `pnpm build`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: extract shared useReverseGeocode hook, remove duplicate geocoding"
```

---

## Task 9: Add Error States to OfferVideo and OfferMap

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferVideo/index.tsx`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferMap/index.tsx`

- [ ] **Step 1: Add error state to OfferVideo**

Read the file. Add error state and onError handler:

```tsx
const [videoError, setVideoError] = useState(false)

// Add to video element:
<video
  // ... existing props
  onError={() => setVideoError(true)}
>

// Before the video element, add error fallback:
{videoError && (
  <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
    <div className="text-center text-muted-foreground">
      <p>Nie udało się załadować wideo</p>
      <button
        onClick={() => { setVideoError(false); videoRef.current?.load() }}
        className="mt-2 text-sm text-primary underline"
      >
        Spróbuj ponownie
      </button>
    </div>
  </div>
)}
```

When `videoError` is true, show the fallback instead of the video player.

- [ ] **Step 2: Add error/timeout state to OfferMap**

Read the file. Add a timeout for map loading:

```tsx
const [mapError, setMapError] = useState(false)

useEffect(() => {
  if (mapReady) return
  const timeout = setTimeout(() => {
    if (!mapReady) setMapError(true)
  }, 10000) // 10 seconds
  return () => clearTimeout(timeout)
}, [mapReady])

// In the loading section, add error handling:
{!mapReady && (
  <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
    {mapError ? (
      <p className="text-sm text-muted-foreground">Nie udało się załadować mapy</p>
    ) : (
      <div className="flex flex-col items-center gap-2">
        <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Ładowanie mapy...</p>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add error states to OfferVideo and OfferMap"
```

---

## Task 10: Final Build Verification

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: Clean build with no errors.

- [ ] **Step 2: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address build issues from code quality optimization"
```

---

## Verification Checklist

After all tasks:

- [ ] All images with `fill` have a `sizes` prop
- [ ] OrbitVisualization logos render through Next.js optimization (no `unoptimized`)
- [ ] Static constants are at module scope, not recreated per render
- [ ] `getIconUrl` is imported from shared utility in both ServiceCategories files
- [ ] OfferListCard, ContactDetails, InfoRow wrapped in React.memo
- [ ] ContactDetails and OfferGallery no longer have `use client`
- [ ] queryBuilder.ts is split into 3 files with preserved exports
- [ ] LocationSearch and ActiveFilters use shared `useReverseGeocode` hook
- [ ] OfferVideo shows error fallback when video fails
- [ ] OfferMap shows error message after 10s timeout
