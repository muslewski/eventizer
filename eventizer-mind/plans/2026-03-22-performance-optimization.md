# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce browser memory from ~500MB to ~250-300MB and improve page load speed.

**Architecture:** Phased optimization: first remove dead weight (unused deps, duplicate libs), then restructure Google Maps loading from global to per-route, then optimize WebGL and animation lifecycles, then improve server-side data fetching. Each phase is independently deployable and verifiable.

**Tech Stack:** Next.js 16, React 19, Payload CMS 3.75, motion (framer-motion v12+), OGL (WebGL), Google Maps JS API

**Spec:** `docs/superpowers/specs/2026-03-22-performance-optimization-design.md`

---

## Task 1: Remove Unused 3D Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove unused 3D dependencies only**

Remove `@react-three/fiber`, `@react-three/drei`, and `maath` from `package.json` dependencies:

```json
// DELETE these lines from "dependencies":
"@react-three/drei": "^10.7.4",
"@react-three/fiber": "^9.3.0",
"maath": "^0.10.8",
```

Note: `framer-motion` and `mathjs` are removed in Tasks 2 and 3 respectively, AFTER their source code imports are updated.

- [ ] **Step 2: Install updated dependencies**

Run: `pnpm install`
Expected: Lockfile updates, no errors.

- [ ] **Step 3: Verify build still works**

Run: `pnpm build`
Expected: Build succeeds (these packages have zero imports in the codebase).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "perf: remove unused 3D deps (react-three, maath)"
```

---

## Task 2: Consolidate framer-motion → motion/react

**Files:**
- Modify (16 files with `framer-motion` imports):
  - `src/blocks/ComingSoon/Component.client.tsx`
  - `src/blocks/HowItWorks/Component.client.tsx`
  - `src/blocks/SocialMedia/Component.client.tsx`
  - `src/blocks/ContactForm/Component.client.tsx`
  - `src/blocks/BetaBanner/Component.client.tsx`
  - `src/blocks/Mission/OrbitVisualization.tsx`
  - `src/blocks/Mission/Component.client.tsx`
  - `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferContactForm/index.tsx`
  - `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/index.tsx`
  - `src/components/frontend/Header/HeaderCTA/index.tsx`
  - `src/components/frontend/Header/StickyHeader/index.tsx`
  - `src/components/frontend/Header/FullScreenMenu/index.tsx`
  - `src/components/frontend/Header/AnimatedMenuIcon/index.tsx`
  - `src/components/frontend/Footer/index.tsx`
  - `src/components/payload/customNav/index.client.tsx`
  - `src/components/payload/fields/titleCharCounter/index.tsx`

- [ ] **Step 1: Replace all `framer-motion` imports with `motion/react`**

In every file listed above, change:
```ts
// FROM:
import { motion } from 'framer-motion'
import { motion, AnimatePresence } from 'framer-motion'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import type { Transition } from 'framer-motion'
import { motion, type Variants, type Transition } from 'framer-motion'

// TO:
import { motion } from 'motion/react'
import { motion, AnimatePresence } from 'motion/react'
import { motion, useScroll, useMotionValueEvent } from 'motion/react'
import type { Transition } from 'motion/react'
import { motion, type Variants, type Transition } from 'motion/react'
```

Note: Three files have TWO import lines from `framer-motion` — update both lines in each:
- `src/components/frontend/Header/FullScreenMenu/index.tsx`
- `src/blocks/HowItWorks/Component.client.tsx`
- `src/components/frontend/Header/AnimatedMenuIcon/index.tsx`

- [ ] **Step 2: Remove `framer-motion` from package.json**

Now that all imports are migrated, remove the old package:

```json
// DELETE this line from "dependencies":
"framer-motion": "^12.23.26",
```

Run: `pnpm install`

- [ ] **Step 3: Verify no framer-motion imports remain**

Run: `grep -r "from 'framer-motion'" src/`
Expected: No matches.

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds with no import errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "perf: consolidate framer-motion imports to motion/react"
```

---

## Task 3: Replace mathjs with Native Math

**Files:**
- Modify: `src/components/react-bits/GradualBlur.tsx:2,194,199-202`

- [ ] **Step 1: Replace mathjs import and usages**

In `src/components/react-bits/GradualBlur.tsx`:

Replace line 2:
```ts
// FROM:
import * as math from 'mathjs';

// TO:
// (delete the import entirely — no replacement needed)
```

Replace line 194:
```ts
// FROM:
blurValue = Number(math.pow(2, progress * 4)) * 0.0625 * currentStrength;

// TO:
blurValue = Math.pow(2, progress * 4) * 0.0625 * currentStrength;
```

Replace lines 199-202:
```ts
// FROM:
const p1 = math.round((increment * i - increment) * 10) / 10;
const p2 = math.round(increment * i * 10) / 10;
const p3 = math.round((increment * i + increment) * 10) / 10;
const p4 = math.round((increment * i + increment * 2) * 10) / 10;

// TO:
const p1 = Math.round((increment * i - increment) * 10) / 10;
const p2 = Math.round(increment * i * 10) / 10;
const p3 = Math.round((increment * i + increment) * 10) / 10;
const p4 = Math.round((increment * i + increment * 2) * 10) / 10;
```

- [ ] **Step 2: Remove mathjs from package.json**

Now that the import is gone, remove the package:

```json
// DELETE this line from "dependencies":
"mathjs": "^14.6.0",
```

Run: `pnpm install`

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/react-bits/GradualBlur.tsx package.json pnpm-lock.yaml
git commit -m "perf: replace mathjs with native Math in GradualBlur"
```

---

## Task 4: Add optimizePackageImports to Next Config

**Files:**
- Modify: `next.config.mjs:5-9`

- [ ] **Step 1: Add optimizePackageImports**

In `next.config.mjs`, update the `experimental` block:

```js
// FROM:
experimental: {
  serverActions: {
    bodySizeLimit: '60mb',
  },
},

// TO:
experimental: {
  serverActions: {
    bodySizeLimit: '60mb',
  },
  optimizePackageImports: ['lucide-react', 'motion', 'embla-carousel-react'],
},
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "perf: add optimizePackageImports for tree-shaking"
```

---

## Task 5: Clean Up Static Assets

**Files:**
- Delete: `src/assets/howItWorks/how-it-works-background.png`

- [ ] **Step 1: Verify the compressed version is what's actually imported**

Run: `grep -r "how-it-works-background" src/ --include="*.tsx" --include="*.ts"`
Expected: Only references to `how-it-works-background-compressed.png`.

- [ ] **Step 2: Delete uncompressed duplicate**

```bash
rm src/assets/howItWorks/how-it-works-background.png
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds — no broken imports.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "perf: delete uncompressed how-it-works background (769KB)"
```

Note: Logo PNG optimization and favicon SVG optimization are deferred — they require design tooling (e.g., converting PNGs to SVGs or re-exporting) which is better done manually by the team.

---

## Task 6: Remove GoogleMapsProvider from Root Layout

**Files:**
- Modify: `src/app/(frontend)/[lang]/layout.tsx:9,62,71`

- [ ] **Step 1: Remove GoogleMapsProvider import and wrapper**

In `src/app/(frontend)/[lang]/layout.tsx`:

Remove the import (line 9):
```ts
// DELETE:
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider'
```

Remove the `<GoogleMapsProvider>` wrapper (lines 62 and 71). The children should stay in place:
```tsx
// FROM:
<RootAuthProvider>
  <GoogleMapsProvider>
  <div className="w-full px-4 sm:px-8 transition-[padding] duration-900 ease-in-out">
    ...
  </div>
  <Footer />
  <Toaster />
  </GoogleMapsProvider>
</RootAuthProvider>

// TO:
<RootAuthProvider>
  <div className="w-full px-4 sm:px-8 transition-[padding] duration-900 ease-in-out">
    ...
  </div>
  <Footer />
  <Toaster />
</RootAuthProvider>
```

- [ ] **Step 2: Create a LazyGoogleMapsProvider with IntersectionObserver**

Create a new component that defers Google Maps loading until visible:

```tsx
// src/components/providers/LazyGoogleMapsProvider.tsx
'use client'

import React, { useRef, useState, useEffect, ReactNode } from 'react'
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider'

export function LazyGoogleMapsProvider({ children }: { children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }  // Start loading 200px before visible
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sentinelRef}>
      {shouldLoad ? (
        <GoogleMapsProvider>{children}</GoogleMapsProvider>
      ) : (
        children
      )}
    </div>
  )
}
```

- [ ] **Step 3: Use LazyGoogleMapsProvider for homepage OffersMap block**

In `src/blocks/OffersMap/Component.client.tsx`, wrap content with `LazyGoogleMapsProvider`. This defers Google Maps loading until the map section scrolls into viewport (the map is below the fold on the homepage):

```tsx
import { LazyGoogleMapsProvider } from '@/components/providers/LazyGoogleMapsProvider'

// Wrap the returned JSX with LazyGoogleMapsProvider
export default function OffersMapClient(props) {
  return (
    <LazyGoogleMapsProvider>
      {/* existing component content */}
    </LazyGoogleMapsProvider>
  )
}
```

- [ ] **Step 4: Add GoogleMapsProvider to offer listing ClientListView**

Both `LocationSearch` and `ActiveFilters` on the `/ogloszenia` route use `useGoogleMaps()`. Wrap their common ancestor `ClientListView` (`src/app/(frontend)/[lang]/ogloszenia/ListView/index.client.tsx`) with `GoogleMapsProvider`:

```tsx
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider'

// Wrap the top-level return of ClientListView
export default function ClientListView(props) {
  return (
    <GoogleMapsProvider>
      {/* existing ClientListView content */}
    </GoogleMapsProvider>
  )
}
```

This ensures both `LocationSearch` and `ActiveFilters` have access to the Google Maps context when the listing route mounts.

- [ ] **Step 4: Add GoogleMapsProvider to individual offer map**

In `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferMap/index.tsx`, wrap with `GoogleMapsProvider`:

```tsx
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider'

// Wrap the map component
export default function OfferMap(props) {
  return (
    <GoogleMapsProvider>
      {/* existing map content */}
    </GoogleMapsProvider>
  )
}
```

- [ ] **Step 6: Verify admin location picker**

The admin location picker (`src/components/payload/fields/locationPicker/index.tsx`) uses `@googlemaps/js-api-loader` directly, NOT `GoogleMapsProvider`. No changes needed — verify it still works independently.

- [ ] **Step 7: Test all map pages**

Verify maps load correctly on:
1. Homepage (OffersMap block) — navigate to homepage, scroll to map section
2. Offer listing (`/ogloszenia`) — check LocationSearch autocomplete works
3. Individual offer (`/ogloszenia/[slug]`) — check map displays
4. Admin location picker — check picker works

Also verify non-map pages (auth, dashboard, help) do NOT load Google Maps JS:
- Open Chrome DevTools → Network tab → filter by "maps.googleapis.com"
- Navigate to a non-map page — should see zero Google Maps requests

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "perf: scope GoogleMapsProvider to map-using routes only"
```

---

## Task 7: Optimize LightRays WebGL Lifecycle

**Files:**
- Modify: `src/components/react-bits/LightRays.tsx`

- [ ] **Step 1: Change visibility behavior from destroy/recreate to pause/resume**

The current code (line 135-399) has `isVisible` in the dependency array, causing the entire WebGL context to be destroyed and recreated on every visibility change. Instead:

1. Remove `isVisible` from the main effect's dependency array (line 385-399)
2. Move the RAF start/stop into a separate effect that depends only on `isVisible`
3. Keep the GL context alive across visibility changes

Replace the visibility/render pattern:

```tsx
// Add a ref to track visibility without triggering GL rebuild
const isVisibleRef = useRef(false)

// Keep the existing IntersectionObserver effect but update a ref too
useEffect(() => {
  if (!containerRef.current) return
  observerRef.current = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      const visible = entry.isIntersecting
      isVisibleRef.current = visible
      setIsVisible(visible)
    },
    { threshold: 0 },
  )
  observerRef.current.observe(containerRef.current)
  return () => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
  }
}, [])

// In the main GL init effect: remove `isVisible` from deps
// Only run when props change, not visibility
useEffect(() => {
  if (!containerRef.current) return
  // ... existing GL init code ...

  // Modified render loop with visibility check and 30fps cap:
  let lastFrame = 0
  const loop = (t: number) => {
    if (!rendererRef.current || !uniformsRef.current || !meshRef.current) return

    // Skip rendering if not visible
    if (!isVisibleRef.current) {
      animationIdRef.current = requestAnimationFrame(loop)
      return
    }

    // 30fps cap
    if (t - lastFrame < 33.33) {
      animationIdRef.current = requestAnimationFrame(loop)
      return
    }
    lastFrame = t

    // ... rest of existing render code ...
  }

  // ... rest of init ...
}, [
  // Remove isVisible from this array
  raysOrigin, raysColor, raysSpeed, lightSpread, rayLength,
  pulsating, fadeDistance, saturation, followMouse, mouseInfluence,
  noiseAmount, distortion,
])
```

- [ ] **Step 2: Add debounced resize handler**

Replace the resize listener (around line 343):

```tsx
// Add debounce for resize
let resizeTimeout: ReturnType<typeof setTimeout>
const debouncedResize = () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(updatePlacement, 200)
}
window.addEventListener('resize', debouncedResize)

// In cleanup:
cleanupFunctionRef.current = () => {
  clearTimeout(resizeTimeout)
  window.removeEventListener('resize', debouncedResize)
  // ... rest of cleanup ...
}
```

- [ ] **Step 3: Add throttled mouse tracking**

Replace the mouse move handler (lines 437-450):

```tsx
useEffect(() => {
  let lastMouseUpdate = 0
  const handleMouseMove = (e: MouseEvent) => {
    const now = performance.now()
    if (now - lastMouseUpdate < 33.33) return  // ~30hz throttle
    lastMouseUpdate = now

    if (!containerRef.current || !rendererRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mouseRef.current = { x, y }
  }

  if (followMouse) {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }
}, [followMouse])
```

- [ ] **Step 4: Lower DPR cap**

Change line 151:
```ts
// FROM:
dpr: Math.min(window.devicePixelRatio, 2),

// TO:
dpr: Math.min(window.devicePixelRatio, 1.5),
```

Also change line 300:
```ts
// FROM:
renderer.dpr = Math.min(window.devicePixelRatio, 2)

// TO:
renderer.dpr = Math.min(window.devicePixelRatio, 1.5)
```

- [ ] **Step 5: Verify visually**

Start dev server: `pnpm dev`
Navigate to homepage, verify:
1. LightRays animation looks the same
2. Mouse interaction still works
3. Scrolling past and back works (animation resumes without flicker)

- [ ] **Step 6: Commit**

```bash
git add src/components/react-bits/LightRays.tsx
git commit -m "perf: optimize LightRays — 30fps cap, pause off-screen, debounce resize"
```

---

## Task 8: Pause OrbitVisualization When Off-Screen

**Files:**
- Modify: `src/blocks/Mission/OrbitVisualization.tsx`

- [ ] **Step 1: Add IntersectionObserver with CSS animation-play-state control**

Use CSS `animation-play-state: paused` via a class toggle instead of changing the `animate` prop (which would reset animation position and cause a visual jump). Add a wrapper with visibility detection:

```tsx
'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'motion/react'
// ... other imports ...

export const OrbitVisualization: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-w-md mx-auto"
      style={!isVisible ? { ['--motion-play-state' as string]: 'paused' } : undefined}
    >
      {/* Existing content stays the same — motion elements keep their animate props */}
      {/* The CSS variable approach pauses without resetting position */}
      {/* ... */}
    </div>
  )
}
```

Then add to `src/styles/global.css`:

```css
/* Pause motion animations when container signals paused */
[style*="--motion-play-state: paused"] * {
  animation-play-state: paused !important;
}
```

Note: framer-motion (motion/react) uses the Web Animations API for infinite animations, which respects `animation-play-state`. If testing reveals the CSS approach doesn't work for all motion elements, fall back to wrapping with `<LazyMotion>` and using `useAnimationControls()` to call `controls.stop()` / `controls.start()` on each animated element.

- [ ] **Step 2: Verify visually**

Start dev server, scroll to the Mission section and verify:
1. Orbits rotate when visible
2. Orbits pause in place when scrolled away (no snap/jump)
3. Orbits resume smoothly from paused position when scrolled back

- [ ] **Step 3: Commit**

```bash
git add src/blocks/Mission/OrbitVisualization.tsx
git commit -m "perf: pause OrbitVisualization animations when off-screen"
```

---

## Task 9: Implement Reduce-Motion CSS Support

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/components/react-bits/LightRays.tsx`
- Modify: `src/blocks/Mission/OrbitVisualization.tsx`

- [ ] **Step 1: Add reduce-motion CSS rules**

In `src/styles/global.css`, add:

```css
/* Reduce motion support */
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
```

This globally disables CSS animations and transitions when reduce-motion is active.

- [ ] **Step 2: Add reduce-motion check to LightRays**

In `src/components/react-bits/LightRays.tsx`, at the top of the component, check for reduce-motion and skip rendering entirely:

```tsx
const LightRays: React.FC<LightRaysProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  // ... existing refs ...

  // Check reduce-motion preference
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    const check = () => setReduceMotion(
      document.documentElement.classList.contains('reduce-motion')
    )
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // In the render loop, skip if reduce-motion
  // (add this check alongside the isVisibleRef check)
```

- [ ] **Step 3: Add reduce-motion check to OrbitVisualization**

In `src/blocks/Mission/OrbitVisualization.tsx`, add the same pattern — when reduce-motion is active, show static orbits without rotation.

- [ ] **Step 4: Verify**

Toggle reduce-motion via the header button. Verify:
1. LightRays stops/simplifies
2. OrbitVisualization stops rotating
3. Other framer-motion animations are stilled via CSS

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/components/react-bits/LightRays.tsx src/blocks/Mission/OrbitVisualization.tsx
git commit -m "perf: implement reduce-motion support for animations"
```

---

## Task 10: Parallelize HeroView Media Queries

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/HeroView/index.tsx`

- [ ] **Step 1: Wrap queries in Promise.all**

Replace the three sequential queries (lines 10-46) with:

```tsx
export default async function HeroView({ payload }: HeroViewProps) {
  const [
    { docs: darkDocs },
    { docs: lightDocs },
    { docs: videoDocs },
  ] = await Promise.all([
    payload.find({
      collection: 'media',
      where: { filename: { equals: 'offers-background-compressed.jpg' } },
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: 'media',
      where: { filename: { equals: 'offers-background2-light-compressed.jpeg' } },
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: 'media',
      where: { filename: { equals: 'offers-background-video-compressed.mp4' } },
      limit: 1,
      depth: 0,
    }),
  ])

  const backgroundImage = darkDocs[0] || null
  const lightBackgroundImage = lightDocs[0] || null
  const backgroundVideo = videoDocs[0] || null

  return (
    <HighImpactHero
      title="Znajdź specjalistów, którzy uczynią Twoje wydarzenie wyjątkowym"
      backgroundImage={backgroundImage}
      lightBackgroundImage={lightBackgroundImage}
      backgroundVideo={backgroundVideo}
      showScrollIndicator
    />
  )
}
```

- [ ] **Step 2: Verify the offers listing page still renders correctly**

Start dev server, navigate to `/ogloszenia`. Verify hero image and video still display.

- [ ] **Step 3: Commit**

```bash
git add src/app/(frontend)/[lang]/ogloszenia/HeroView/index.tsx
git commit -m "perf: parallelize HeroView media queries with Promise.all"
```

---

## Task 11: Deduplicate Offer Page Query

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/page.tsx`

- [ ] **Step 1: Wrap queryOfferPageBySlug with React cache()**

Move the function to module scope and wrap with `cache()`:

```tsx
import { cache } from 'react'
import { getPayload, Locale } from 'payload'
import configPromise from '@payload-config'
// ... other imports ...

// Wrapped with cache() — deduplicates within a single request lifecycle
const queryOfferPageBySlug = cache(async ({ slug, lang }: { slug: string; lang: Locale }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'offers',
    limit: 1,
    overrideAccess: true,
    pagination: false,
    depth: 2,
    where: {
      and: [
        { link: { equals: slug } },
        { _status: { equals: 'published' } },
      ],
    },
  })

  return result.docs?.[0] || null
})

// generateMetadata and page component remain the same — they both call
// queryOfferPageBySlug but React's cache() ensures only one DB query runs
```

- [ ] **Step 2: Verify offer pages still render with metadata**

Navigate to an individual offer page. Check:
1. Page renders correctly
2. Meta tags are set (view source or check `<head>`)

- [ ] **Step 3: Commit**

```bash
git add src/app/(frontend)/[lang]/ogloszenia/[slug]/page.tsx
git commit -m "perf: deduplicate offer page query with React cache()"
```

---

## Task 12: Add Depth/Select Limits to Key Queries

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/index.tsx:27-31`
- Modify: `src/actions/getOfferCategories.ts` (depth reduction)
- Modify: `src/actions/resolveCategoryIconUrl.ts:17-22`

- [ ] **Step 1: Optimize ListView category query**

In `src/app/(frontend)/[lang]/ogloszenia/ListView/index.tsx`, update the categories query:

```tsx
// FROM:
const categories = await payload.find({
  collection: 'service-categories',
  limit: 100,
  overrideAccess: true,
})

// TO:
const categories = await payload.find({
  collection: 'service-categories',
  limit: 100,
  depth: 0,
  overrideAccess: true,
})
```

- [ ] **Step 2: Optimize getOfferCategories query**

In `src/actions/getOfferCategories.ts`, find the main `payload.find` call for `service-categories` (around line 199) and reduce depth:

```tsx
// FROM:
const { docs: categories } = await payload.find({
  collection: 'service-categories',
  depth: 2,
  limit: 100,
  sort: 'name',
})

// TO:
const { docs: categories } = await payload.find({
  collection: 'service-categories',
  depth: 1,
  limit: 100,
  sort: 'name',
})
```

Reducing from `depth: 2` to `depth: 1` avoids fetching deeply nested relationship chains. The category tree building logic only needs one level of media resolution (icons).

- [ ] **Step 3: Optimize resolveCategoryIconUrl query**

In `src/actions/resolveCategoryIconUrl.ts`, update the query:

```tsx
// FROM:
const result = await payload.find({
  collection: 'service-categories',
  where: { slug: { equals: rootSlug } },
  limit: 1,
  depth: 1,
})

// TO:
const result = await payload.find({
  collection: 'service-categories',
  where: { slug: { equals: rootSlug } },
  limit: 1,
  depth: 1,  // Keep depth: 1 — needed for subcategory walking and icon media resolution
})
```

Note: After review, `resolveCategoryIconUrl` needs `depth: 1` to resolve the `icon` media relationship. Keep as-is. The main wins are the ListView and getOfferCategories queries.

- [ ] **Step 4: Verify**

Navigate to `/ogloszenia` — check categories display in sidebar. Navigate to an individual offer — check category icon displays.

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/[lang]/ogloszenia/ListView/index.tsx src/actions/getOfferCategories.ts src/actions/resolveCategoryIconUrl.ts
git commit -m "perf: add depth limits to category queries"
```

---

## Task 13: Parallelize User Deletion Hooks

**Files:**
- Modify: `src/collections/auth/Users/hooks/deleteRelatedUserData.ts`

- [ ] **Step 1: Wrap sequential deletes in Promise.all**

```tsx
export const deleteRelatedUserData: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await Promise.all([
    req.payload.delete({
      collection: 'user-sessions',
      where: { userId: { equals: id } },
      req,
    }),
    req.payload.delete({
      collection: 'user-accounts',
      where: { userId: { equals: id } },
      req,
    }),
    req.payload.delete({
      collection: 'user-verifications',
      where: {},
      req,
    }),
    req.payload.delete({
      collection: 'help-tickets',
      where: { user: { equals: id } },
      req,
    }),
  ])
}
```

- [ ] **Step 2: Commit**

```bash
git add src/collections/auth/Users/hooks/deleteRelatedUserData.ts
git commit -m "perf: parallelize user deletion hooks with Promise.all"
```

---

## Task 14: Run Playwright Smoke Tests

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test:e2e`
Expected: All existing tests pass. If any fail, investigate whether the failure is related to these performance changes.

- [ ] **Step 2: Run build one final time**

Run: `pnpm build`
Expected: Clean build with no errors or warnings related to these changes.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "perf: fix test/build issues from performance optimization"
```

---

## Verification Checklist

After all tasks are complete, manually verify:

- [ ] Homepage: LightRays animation runs smoothly, pauses off-screen
- [ ] Homepage: OrbitVisualization pauses when scrolled past
- [ ] Homepage: OffersMap block loads Google Maps when scrolled to
- [ ] `/ogloszenia`: Search, filters, and map all work
- [ ] `/ogloszenia/[slug]`: Offer page renders with map and correct metadata
- [ ] Non-map pages: No Google Maps network requests in DevTools
- [ ] Reduce-motion toggle: Animations stop when enabled
- [ ] Chrome DevTools Performance Monitor: JS Heap size noticeably reduced vs. baseline

---

## Deferred Items

These spec items are intentionally deferred from this plan:

- **Spec 4.2 — StickyHeader scroll throttle:** Low priority per spec. React already batches `setHidden()` and only re-renders when the boolean changes. Defer unless profiling shows this as a bottleneck.
- **Spec 4.3 — Google Maps theme toggle investigation:** Requires research into whether `map.setOptions({ colorScheme })` works with Cloud-styled maps + `mapId`. Investigate separately.
- **Spec 1.4 — Logo PNG optimization and favicon SVG compression:** Requires design tooling (SVG re-export, manual compression). Better done by the team with proper design tools.
