# Performance Optimization Design

**Date:** 2026-03-22
**Goal:** Reduce browser memory consumption from ~500MB to ~250-300MB, improve page load speed for SEO and UX.
**Constraint:** All existing features, animations, and interactions must be preserved.

---

## Problem

The Eventizer app consumes up to 500MB of browser memory after scrolling the homepage, with a ~382MB baseline across all pages. This degrades user experience and SEO scores. The root causes are: unused dependencies shipped to the client, Google Maps loading globally on every page, a WebGL renderer running at full frame rate continuously, infinite animations never pausing, and unoptimized server-side data fetching adding to load times.

---

## Section 1: Dead Weight Removal

**Priority:** P0 (zero risk, immediate wins)

### 1.1 Remove unused dependencies

Delete from `package.json`:
- `@react-three/fiber` (3D rendering — no imports found in codebase)
- `@react-three/drei` (3D utilities — no imports found in codebase)
- `maath` (math utilities for 3D — no imports found in codebase)

### 1.2 Consolidate animation library

The project ships both `framer-motion` (legacy name) and `motion` (v12+ name). They are the same library — `motion` is the canonical package for v12+ and re-exports all `framer-motion` compatible APIs.

- Remove `framer-motion` from `package.json`
- Update all imports from `framer-motion` to `motion` across the codebase (~16 files use `framer-motion`, ~6 files already use `motion` — 22 total import sites)
- Keep `motion` as the single animation dependency

### 1.3 Replace mathjs with native Math

**File:** `src/components/react-bits/GradualBlur.tsx`

The entire `mathjs` library is imported for `math.pow()` and `math.round()`, which have native equivalents. While tree-shaking reduces the actual client bundle impact below the 35MB unpacked npm size, it still adds unnecessary weight for two functions available natively.

- Replace `import * as math from 'mathjs'` with native `Math.pow()` and `Math.round()`
- Remove `mathjs` from `package.json`

### 1.4 Clean up static assets

- Delete `src/assets/howItWorks/how-it-works-background.png` (769KB) — the compressed version `how-it-works-background-compressed.png` (189KB) is already in use
- Optimize logo PNGs (`eventizer-logo-1-dark.png`, `eventizer-logo-1-light.png`, `eventizer-icon-1.png`) — convert to SVG or heavily compress (currently ~1MB combined)
- Compress `dashboard-banner.jpeg` (1MB target: ~250KB)
- Optimize `public/my-favicon/icon0.svg` (431KB target: <50KB)

### 1.5 Add optimizePackageImports

In `next.config.mjs`, add:
```js
experimental: {
  optimizePackageImports: ['lucide-react', 'motion', 'embla-carousel-react']
}
```

This enables tree-shaking for barrel-exported libraries.

---

## Section 2: Google Maps Lazy Loading

**Priority:** P0 (high memory impact)

### Current state

`GoogleMapsProvider` wraps the entire app at the root layout (`src/app/(frontend)/[lang]/layout.tsx`), loading 3 Google Maps libraries (`places`, `maps`, `marker`) on every page visit — including auth pages, dashboard, and help pages that never use maps.

### Target state

- Remove `GoogleMapsProvider` from the root layout
- Load Google Maps per-route/per-component:
  - **Homepage OffersMap block:** Defer loading until the section scrolls into viewport via IntersectionObserver (map is below the fold)
  - **Offer listing page (`/ogloszenia`):** Load when the route mounts (maps are core to this page)
  - **Individual offer pages (`/ogloszenia/[slug]`):** Load when the OfferMap component mounts
  - **Admin location picker** (`src/components/payload/fields/locationPicker/index.tsx`): Load when the picker component mounts

### Implementation approach

Create a lazy wrapper component (e.g., `LazyGoogleMapsProvider`) that:
1. Uses IntersectionObserver to detect when the wrapped content enters the viewport
2. Only then initializes the Google Maps loader and imports the required libraries
3. Shows a placeholder/skeleton until maps are ready

Pages that don't use maps will never load Google Maps JavaScript.

---

## Section 3: LightRays WebGL Optimization

**Priority:** P1 (GPU memory reduction)

**File:** `src/components/react-bits/LightRays.tsx`

### Current state

The LightRays component runs a continuous `requestAnimationFrame` loop at 60fps with unthrottled mouse tracking and resize listeners. It already has an IntersectionObserver that fully destroys and recreates the WebGL context on visibility changes — this is actually more aggressive than needed, as reinitializing GL contexts has its own cost.

### Changes

1. **Optimize visibility behavior:** The current destroy/recreate pattern on visibility change is costly. Instead, pause the RAF loop and keep the GL context alive when off-screen, only destroying on unmount. This avoids both the cost of continuous rendering AND the cost of repeated GL initialization.

2. **Cap frame rate to 30fps:** Add a timestamp check in the render loop:
   ```js
   const now = performance.now()
   if (now - lastFrame < 33.33) { requestAnimationFrame(loop); return }
   lastFrame = now
   ```

3. **Debounce resize listener:** Add a 200ms debounce to the resize handler (currently fires on every pixel).

4. **Throttle mouse tracking:** Reduce mouse move sampling to ~30hz (currently fires on every mousemove event at 60hz+).

5. **Lower DPR cap:** Change `Math.min(window.devicePixelRatio, 2)` to `Math.min(window.devicePixelRatio, 1.5)` for reduced canvas resolution on high-DPI screens.

### What stays the same

The visual effect, animation behavior, and mouse interaction are preserved. The changes only affect rendering efficiency.

---

## Section 4: Animation Lifecycle Management

**Priority:** P1 (CPU/memory reduction)

### 4.1 Pause off-screen animations

**File:** `src/blocks/Mission/OrbitVisualization.tsx`

The OrbitVisualization component runs infinite rotation animations (160s, 80s, 60s cycles) with particles. These run permanently once mounted.

- Wrap with IntersectionObserver
- Set framer-motion animations to `paused` when not in viewport
- Resume when scrolled back into view

Apply the same pattern to any other block with infinite animations.

### 4.2 Throttle StickyHeader scroll handler

**File:** `src/components/frontend/Header/StickyHeader/index.tsx`

`useMotionValueEvent` fires on every scroll pixel. Note: React batches `setHidden()` calls and only re-renders when the boolean actually changes, so the real-world impact may be minimal. This is a low-priority optimization.

- Replace `useMotionValueEvent` with `scrollY.on('change', handler)` using a timestamp-based throttle (~100ms)
- Verify the visual behavior (header show/hide on scroll) remains responsive after throttling

### 4.3 Investigate Google Maps theme toggle

**File:** `src/blocks/OffersMap/Component.client.tsx`

Currently destroys and recreates the entire map + all markers when switching themes. The code uses Cloud-styled maps with `mapId`, which may require construction-time `colorScheme` setting.

- Test whether `map.setOptions({ colorScheme })` works with Cloud-styled maps (`mapId`). If it does, use it to update theme in-place without recreating the map instance.
- If `setOptions` does not work with `mapId`-based styling, drop this optimization — the current approach is functionally correct, just costly on theme toggle.

### 4.4 Implement reduce-motion support

**File:** `src/components/frontend/Header/ReduceMotionToggle/index.tsx`

The toggle sets `.reduce-motion` class on `document.documentElement`. There is partial support — `BackgroundVideo` already hides when reduce-motion is active — but most animations (LightRays, OrbitVisualization, framer-motion animations) ignore it.

- Add CSS rules that disable/simplify animations when `.reduce-motion` is active
- Check for the class in JS animation components (LightRays, OrbitVisualization) and skip or simplify rendering

---

## Section 5: Server-Side Data Fetching Optimization

**Priority:** P2 (load time, not memory)

### 5.1 Parallelize HeroView media queries

**File:** `src/app/(frontend)/[lang]/ogloszenia/HeroView/index.tsx`

Three sequential Payload queries fetch media by filename. Wrap in `Promise.all()`:
```ts
const [darkBg, lightBg, video] = await Promise.all([
  payload.find({ collection: 'media', where: { filename: { equals: '...' } }, limit: 1, depth: 0 }),
  payload.find({ collection: 'media', where: { filename: { equals: '...' } }, limit: 1, depth: 0 }),
  payload.find({ collection: 'media', where: { filename: { equals: '...' } }, limit: 1, depth: 0 }),
])
```

Also add `depth: 0` and `select` to limit returned fields.

### 5.2 Deduplicate offer page queries

**File:** `src/app/(frontend)/[lang]/ogloszenia/[slug]/page.tsx`

`generateMetadata()` and the page component both call `queryOfferPageBySlug()` separately with `depth: 2`.

- Move `queryOfferPageBySlug()` to a separate utility module (or module scope), then wrap it with React's `cache()` function. The `cache()` wrapper requires a stable function reference at module scope to deduplicate within a single request lifecycle.

### 5.3 Add depth/select limits to key queries

- `getOfferCategories`: Reduce `depth: 2` to `depth: 1`, add `select` for only needed fields (`name`, `slug`, `icon`, `requiredPlan`)
- `resolveCategoryIconUrl`: Use `depth: 0` with `select` (only need the icon URL)
- ListView category fetch: Add `depth: 0` and `select` for sidebar display fields only

### 5.4 Parallelize user deletion hooks

**File:** `src/collections/auth/Users/hooks/deleteRelatedUserData.ts`

Four sequential `payload.delete()` calls for different collections. Wrap in `Promise.all()`.

---

## Testing Strategy

1. **Memory measurement:** Use Chrome DevTools Performance Monitor to measure JS Heap size before and after each section
2. **Baseline recording:** Record memory on homepage (scroll to bottom), offer listing, individual offer, and dashboard before any changes
3. **Per-section verification:** After implementing each section, re-measure the same pages
4. **Visual regression:** Manually verify LightRays, OrbitVisualization, OffersMap, and theme toggle look and behave identically
5. **Route testing:** Verify Google Maps still works on all pages that need it (homepage, listing, individual offers, admin picker)
6. **Reduce-motion testing:** Toggle reduce-motion and verify animations stop/simplify
7. **Smoke test:** Run existing Playwright tests to catch navigation regressions
8. **Phased deployment:** Implement and deploy section-by-section, verifying memory measurements between each section before proceeding to the next

---

## Expected Impact

| Section | Memory Reduction | Load Time Impact |
|---|---|---|
| Dead weight removal | ~50-80MB | Smaller bundles |
| Google Maps lazy-load | ~50-100MB on non-map pages | Deferred loading |
| LightRays optimization | ~20-40MB GPU savings | Lower CPU usage |
| Animation lifecycle | ~10-30MB | Lower CPU usage |
| Server-side fetching | None | Faster page loads |
| **Total** | **~130-250MB** | **Meaningful improvement** |

Target: Bring ~500MB peak down to ~250-300MB range.
