# Image Position Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a drag + zoom image framing editor (focal point + zoom stored on `offer-uploads`) with live previews of the hero and list card, plus a display-time `<PositionedImage>` wrapper that every main-image surface consumes.

**Architecture:** Two PRs. PR 1 lays track: adds the `zoom` field, a pure `positionStyles` helper, the `<PositionedImage>` wrapper, and swaps four display consumers — zero user-visible change because defaults reproduce today's rendering. PR 2 ships the `<ImagePositionEditor>` modal module and wires two entry points (wizard media step, panel offer detail hero).

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Payload CMS 3 · `motion/react` (already installed) · shadcn `Dialog` / `Slider` / `Button` · `lucide-react` · Vitest. No new deps.

**Reference skills:** `eventizer-payload-migrations`, `eventizer-server-actions`, `eventizer-panel-conventions`, `eventizer-design-tokens`, `eventizer-offers-wizard`.

**Spec:** [docs/superpowers/specs/2026-04-23-image-position-editor-design.md](../specs/2026-04-23-image-position-editor-design.md).

---

## File structure

```
src/
  collections/uploads/OfferUploads.ts          — MODIFY: add `zoom` field
  migrations/
    20260423_120000_add_offer_upload_zoom.ts   — CREATE
    index.ts                                   — MODIFY: register migration
  components/image-position/                   — CREATE folder (shared, not under panel/)
    types.ts                                   — CREATE
    positionStyles.ts                          — CREATE
    PositionedImage.tsx                        — CREATE
    EditorCanvas.tsx                           — CREATE (PR 2)
    EditorZoomSlider.tsx                       — CREATE (PR 2)
    EditorPreviewPanel.tsx                     — CREATE (PR 2)
    ImagePositionEditor.tsx                    — CREATE (PR 2)
  components/panel/oferty/OfferCard.tsx        — MODIFY: swap Image → PositionedImage
  components/panel/oferty/OfferDetailView.tsx  — MODIFY: swap hero + add edit button (PR 2)
  components/panel/wizard/FileUpload.tsx       — MODIFY: add Dostosuj kadr trigger (PR 2)
  app/(frontend)/[lang]/ogloszenia/ListView/
    OffersView/OfferListCard/index.tsx         — MODIFY: accept position prop
    OffersView/index.tsx                       — MODIFY: pass position down
  app/(frontend)/[lang]/ogloszenia/[slug]/
    components/OfferHero/index.tsx             — MODIFY: pass position through shim
  heros/HighImpact/index.tsx                   — MODIFY: accept backgroundImagePosition
  heros/HighImpact/Background/index.tsx        — MODIFY: forward position
  components/heros/BackgroundImage/index.tsx   — MODIFY: accept + apply position
  actions/panel/offer-uploads.ts               — CREATE (PR 2)
tests/int/
  position-styles.int.spec.ts                  — CREATE (Vitest picks up *.int.spec.ts)
```

Public module exports (no `index.ts` barrel — callers import directly):
- `PositionedImage` from `@/components/image-position/PositionedImage`
- `ImagePositionEditor` from `@/components/image-position/ImagePositionEditor`
- `ImagePosition` / `DEFAULT_POSITION` / `resolvePosition` from `@/components/image-position/types`

---

# PR 1 — Plumbing (zero UX change)

Tasks 1–11. Defaults reproduce today's behavior exactly; every existing offer renders identically after this PR ships.

---

### Task 1: Add `zoom` field to OfferUploads + regenerate types

**Files:**
- Modify: `src/collections/uploads/OfferUploads.ts`

- [ ] **Step 1: Add the `zoom` field after `title`**

In [src/collections/uploads/OfferUploads.ts](../../src/collections/uploads/OfferUploads.ts), inside the `fields: [...]` array, append after the `title` field object and before the closing `]` (around line 95). Paste exactly:

```ts
    {
      name: 'zoom',
      type: 'number',
      defaultValue: 1,
      min: 1,
      max: 3,
      label: {
        en: 'Zoom',
        pl: 'Przybliżenie',
      },
      admin: {
        description: {
          en: 'Scale multiplier for the stored focal point (1–3).',
          pl: 'Mnożnik skali dla punktu głównego (1–3).',
        },
        step: 0.1,
      },
    },
```

No other changes to the file in this task.

- [ ] **Step 2: Regenerate Payload types**

Run: `pnpm generate:types`
Expected: writes to `src/payload-types.ts` with no errors. Confirm the `OfferUpload` interface now has `zoom?: number | null`.

Run: `grep -n "zoom" src/payload-types.ts | head -5` — should show at least one new line inside the `OfferUpload` definition.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors. Pre-existing unused-var lints elsewhere are OK.

- [ ] **Step 4: Commit**

```bash
git add src/collections/uploads/OfferUploads.ts src/payload-types.ts
git commit -m "feat(offer-uploads): add zoom field for image position"
```

---

### Task 2: Create migration to add `zoom` column

**Files:**
- Create: `src/migrations/20260423_120000_add_offer_upload_zoom.ts`
- Modify: `src/migrations/index.ts`

- [ ] **Step 1: Write the migration file**

Create `src/migrations/20260423_120000_add_offer_upload_zoom.ts`:

```ts
// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds the `zoom` column to offer_uploads for the image position editor.
 * OfferUploads has no draft/version table, so only the primary table is touched.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "offer_uploads" ADD COLUMN IF NOT EXISTS "zoom" numeric DEFAULT 1;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "offer_uploads" DROP COLUMN IF EXISTS "zoom";
  `)
}
```

- [ ] **Step 2: Register in the migrations index**

Modify `src/migrations/index.ts` to add the new migration to the exports and array. The current file looks like:

```ts
import * as migration_20251217_102626_backup_before_switch from './20251217_102626_backup_before_switch';
import * as migration_20260420_204841_add_offer_website from './20260420_204841_add_offer_website';

export const migrations = [
  {
    up: migration_20251217_102626_backup_before_switch.up,
    down: migration_20251217_102626_backup_before_switch.down,
    name: '20251217_102626_backup_before_switch'
  },
  {
    up: migration_20260420_204841_add_offer_website.up,
    down: migration_20260420_204841_add_offer_website.down,
    name: '20260420_204841_add_offer_website'
  },
];
```

Add the new import above the `export const migrations` and a new entry to the array. Final file:

```ts
import * as migration_20251217_102626_backup_before_switch from './20251217_102626_backup_before_switch';
import * as migration_20260420_204841_add_offer_website from './20260420_204841_add_offer_website';
import * as migration_20260423_120000_add_offer_upload_zoom from './20260423_120000_add_offer_upload_zoom';

export const migrations = [
  {
    up: migration_20251217_102626_backup_before_switch.up,
    down: migration_20251217_102626_backup_before_switch.down,
    name: '20251217_102626_backup_before_switch'
  },
  {
    up: migration_20260420_204841_add_offer_website.up,
    down: migration_20260420_204841_add_offer_website.down,
    name: '20260420_204841_add_offer_website'
  },
  {
    up: migration_20260423_120000_add_offer_upload_zoom.up,
    down: migration_20260423_120000_add_offer_upload_zoom.down,
    name: '20260423_120000_add_offer_upload_zoom'
  },
];
```

- [ ] **Step 3: Apply the migration locally**

Run: `pnpm payload migrate`
Expected: the migration runs; output mentions `20260423_120000_add_offer_upload_zoom` applied. No errors.

- [ ] **Step 4: Commit**

```bash
git add src/migrations/20260423_120000_add_offer_upload_zoom.ts src/migrations/index.ts
git commit -m "feat(db): migration adds zoom column to offer_uploads"
```

---

### Task 3: Create `types.ts` (ImagePosition, DEFAULT_POSITION, resolvePosition)

**Files:**
- Create: `src/components/image-position/types.ts`

- [ ] **Step 1: Create the file**

Create `src/components/image-position/types.ts`:

```ts
/**
 * Image positioning data stored on an OfferUpload.
 *
 * focalX / focalY are percentages (0–100) to match Payload's built-in
 * focal-point primitive. zoom is a scale multiplier 1–3 applied on top
 * of object-cover at display time.
 */
export interface ImagePosition {
  focalX: number
  focalY: number
  zoom: number
}

export const DEFAULT_POSITION: ImagePosition = {
  focalX: 50,
  focalY: 50,
  zoom: 1,
}

const FOCAL_MIN = 0
const FOCAL_MAX = 100
const ZOOM_MIN = 1
const ZOOM_MAX = 3

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Normalizes a partial / nullable / dirty ImagePosition into a fully
 * defined and clamped one. Safe against stale DB rows with out-of-range
 * values or missing fields.
 */
export function resolvePosition(
  raw: Partial<ImagePosition> | null | undefined,
): ImagePosition {
  if (!raw) return DEFAULT_POSITION

  const focalX = typeof raw.focalX === 'number' ? clamp(raw.focalX, FOCAL_MIN, FOCAL_MAX) : DEFAULT_POSITION.focalX
  const focalY = typeof raw.focalY === 'number' ? clamp(raw.focalY, FOCAL_MIN, FOCAL_MAX) : DEFAULT_POSITION.focalY
  const zoom = typeof raw.zoom === 'number' ? clamp(raw.zoom, ZOOM_MIN, ZOOM_MAX) : DEFAULT_POSITION.zoom

  return { focalX, focalY, zoom }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/image-position/types.ts
git commit -m "feat(image-position): shared types and resolvePosition helper"
```

---

### Task 4: `positionStyles.ts` with TDD unit tests

**Files:**
- Create: `tests/int/position-styles.int.spec.ts`
- Create: `src/components/image-position/positionStyles.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/position-styles.int.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_POSITION,
  resolvePosition,
} from '@/components/image-position/types'
import { positionStyles } from '@/components/image-position/positionStyles'

describe('positionStyles', () => {
  it('returns object-cover + centered position for DEFAULT_POSITION', () => {
    const s = positionStyles(DEFAULT_POSITION)
    expect(s.objectFit).toBe('cover')
    expect(s.objectPosition).toBe('50% 50%')
    expect(s.transform).toBeUndefined()
    expect(s.transformOrigin).toBe('50% 50%')
  })

  it('emits objectPosition for off-center focal', () => {
    const s = positionStyles({ focalX: 20, focalY: 80, zoom: 1 })
    expect(s.objectPosition).toBe('20% 80%')
    expect(s.transform).toBeUndefined()
  })

  it('emits transform: scale for zoom > 1 with origin at focal', () => {
    const s = positionStyles({ focalX: 30, focalY: 40, zoom: 2 })
    expect(s.transform).toBe('scale(2)')
    expect(s.transformOrigin).toBe('30% 40%')
    expect(s.willChange).toBe('transform')
  })
})

describe('resolvePosition', () => {
  it('returns DEFAULT_POSITION for null/undefined/empty input', () => {
    expect(resolvePosition(null)).toEqual(DEFAULT_POSITION)
    expect(resolvePosition(undefined)).toEqual(DEFAULT_POSITION)
    expect(resolvePosition({})).toEqual(DEFAULT_POSITION)
  })

  it('clamps out-of-range values', () => {
    const r = resolvePosition({ focalX: 150, focalY: -10, zoom: 5 })
    expect(r).toEqual({ focalX: 100, focalY: 0, zoom: 3 })
  })

  it('fills missing fields with defaults', () => {
    const r = resolvePosition({ focalX: 30 })
    expect(r).toEqual({ focalX: 30, focalY: 50, zoom: 1 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm run test:int -- position-styles`
Expected: FAIL — "Cannot find module '@/components/image-position/positionStyles'".

- [ ] **Step 3: Create the implementation**

Create `src/components/image-position/positionStyles.ts`:

```ts
import type { CSSProperties } from 'react'
import type { ImagePosition } from './types'

/**
 * Convert an ImagePosition (focalX/Y 0–100, zoom 1–3) into CSS properties
 * suitable for applying to an <img> with object-fit: cover.
 *
 * object-position places the given focal % of the source image at the same
 * focal % of the container. transform: scale() then zooms around that same
 * point so the subject stays anchored as the user zooms in.
 */
export function positionStyles(position: ImagePosition): CSSProperties {
  const { focalX, focalY, zoom } = position
  const origin = `${focalX}% ${focalY}%`
  return {
    objectFit: 'cover',
    objectPosition: origin,
    transform: zoom > 1 ? `scale(${zoom})` : undefined,
    transformOrigin: origin,
    willChange: zoom > 1 ? 'transform' : undefined,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm run test:int -- position-styles`
Expected: PASS — 6 tests across `positionStyles` + `resolvePosition`.

- [ ] **Step 5: Commit**

```bash
git add tests/int/position-styles.int.spec.ts src/components/image-position/positionStyles.ts
git commit -m "feat(image-position): pure positionStyles helper with unit tests"
```

---

### Task 5: `PositionedImage` display wrapper

**Files:**
- Create: `src/components/image-position/PositionedImage.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/image-position/PositionedImage.tsx`:

```tsx
import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { positionStyles } from './positionStyles'
import { resolvePosition, type ImagePosition } from './types'

type PositionedImageProps = Omit<ImageProps, 'src' | 'alt' | 'fill' | 'style'> & {
  src: string
  alt: string
  position?: Partial<ImagePosition> | null
  /** Applied to the outer <div> wrapper (e.g. aspect + sizing). */
  className?: string
  /** Applied to the inner <Image> (e.g. hover:scale-105, transitions). */
  imgClassName?: string
}

/**
 * Display-time wrapper for the main image of an offer.
 *
 * Passes through every next/image prop except src/alt/fill/style (we control
 * those). Reads focalX/Y/zoom from `position` and applies them as
 * object-position + transform so the stored framing shows up on the card.
 * Defaults (center, zoom 1) reproduce today's `<Image fill object-cover>`
 * behavior exactly — offers with no stored position render identically.
 */
export function PositionedImage({
  src,
  alt,
  position,
  className,
  imgClassName,
  ...imageProps
}: PositionedImageProps) {
  const resolved = resolvePosition(position)
  const style = positionStyles(resolved)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        {...imageProps}
        src={src}
        alt={alt}
        fill
        style={style}
        className={imgClassName}
      />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/image-position/PositionedImage.tsx
git commit -m "feat(image-position): PositionedImage display wrapper"
```

---

### Task 6: Swap panel `OfferCard` to `PositionedImage`

**Files:**
- Modify: `src/components/panel/oferty/OfferCard.tsx`

- [ ] **Step 1: Read the file first**

Run: `head -80 src/components/panel/oferty/OfferCard.tsx`

Find the `<Image>` that renders `offer.mainImage.url`. The existing usage looks similar to:

```tsx
<Image
  src={mainImageUrl}
  alt={offer.title}
  fill
  sizes="(max-width: 640px) 100vw, 224px"
  className="object-cover transition-transform duration-300 group-hover:scale-105"
  onLoad={() => setImageLoaded(true)}
/>
```

- [ ] **Step 2: Add import and swap the Image**

Add to the import block at the top (keep the existing `next/image` import only if other `<Image>` uses remain — check the file first; if it was the only one, remove it):

```tsx
import { PositionedImage } from '@/components/image-position/PositionedImage'
```

Replace the `<Image>` with `<PositionedImage>`. Keep the existing container around it (the `<Link>` with its className) — `PositionedImage` is only the image itself. Replace the `<Image fill object-cover hover:scale-105 …>` with this shape (adapt surrounding className wording to match what was there):

```tsx
<PositionedImage
  src={mainImageUrl}
  alt={offer.title}
  position={typeof offer.mainImage === 'object' ? offer.mainImage : null}
  className="absolute inset-0"
  imgClassName="transition-transform duration-300 group-hover:scale-105"
  sizes="(max-width: 640px) 100vw, 224px"
  onLoad={() => setImageLoaded(true)}
/>
```

Important:
- The hover-scale class moves to `imgClassName` so it still animates the inner image, not the wrapper.
- The `position` prop accepts the full `OfferUpload` object (it has `focalX`, `focalY`, `zoom` fields after Task 1). `resolvePosition` handles nulls.
- If the existing surrounding element was already `position: relative`, keep `className="absolute inset-0"` on the `PositionedImage`. If the old `<Image fill>` was inside a `relative` parent, this works identically.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/panel/oferty/OfferCard.tsx
git commit -m "refactor(panel): OfferCard uses PositionedImage"
```

---

### Task 7: Swap panel `OfferDetailView` hero to `PositionedImage`

**Files:**
- Modify: `src/components/panel/oferty/OfferDetailView.tsx`

- [ ] **Step 1: Read the hero section**

The file was reviewed earlier in this session. The 21/9 hero sits around lines 37–62 and uses a raw `<Image fill className="object-cover">` with `src={mainImageUrl}`.

- [ ] **Step 2: Add import and swap**

Add import:

```tsx
import { PositionedImage } from '@/components/image-position/PositionedImage'
```

Replace the `<Image>` inside the hero block. The existing markup is:

```tsx
<div className="relative aspect-[21/9] overflow-hidden rounded-xl">
  {mainImageUrl ? (
    <Image
      src={mainImageUrl}
      alt={offer.title}
      fill
      className="object-cover"
    />
  ) : (
    <div className="size-full bg-muted" />
  )}
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
  ...
</div>
```

Replace the `<Image>` block (keep the ternary, gradient, and text overlay intact):

```tsx
{mainImageUrl ? (
  <PositionedImage
    src={mainImageUrl}
    alt={offer.title}
    position={typeof offer.mainImage === 'object' ? offer.mainImage : null}
    className="absolute inset-0"
    sizes="100vw"
  />
) : (
  <div className="size-full bg-muted" />
)}
```

The `next/image` import at the top can stay — it's used by the Media card gallery further down the file.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/panel/oferty/OfferDetailView.tsx
git commit -m "refactor(panel): OfferDetailView hero uses PositionedImage"
```

---

### Task 8: Swap public `OfferListCard` — extend props + thread position

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard/index.tsx`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/index.tsx`

- [ ] **Step 1: Extend `OfferListCardProps`**

In `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard/index.tsx`, find `interface OfferListCardProps` (currently around lines 11–22). Add a `position` field:

```tsx
import type { ImagePosition } from '@/components/image-position/types'

interface OfferListCardProps {
  title: string
  description: string
  categoryName?: string
  city?: string
  priceMin: number | null
  priceMax: number | null
  price?: number | null
  hasPriceRange?: boolean
  imageUrl?: string
  position?: Partial<ImagePosition> | null
  slug: string
}
```

Destructure `position` in the function arguments.

- [ ] **Step 2: Swap the Image render to PositionedImage**

Locate the `<Image src={imageUrl} …>` inside the component (the thumbnail rendered when `imageUrl` is set). Replace:

```tsx
<Image
  src={imageUrl}
  alt={title}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className={`object-cover hover:scale-105 transition-all duration-300 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
  onLoad={() => setImageLoaded(true)}
/>
```

With:

```tsx
<PositionedImage
  src={imageUrl}
  alt={title}
  position={position}
  className="absolute inset-0"
  imgClassName={`hover:scale-105 transition-all duration-300 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  onLoad={() => setImageLoaded(true)}
/>
```

Add the import near the top of the file:

```tsx
import { PositionedImage } from '@/components/image-position/PositionedImage'
```

The existing `next/image` import can stay or be removed if `PositionedImage` is now the only consumer of images in this file (check for any remaining `<Image …>` usages).

- [ ] **Step 3: Thread position from the caller**

In `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/index.tsx`, find the `<OfferListCard …>` usage (around line 111). The call site currently passes `imageUrl={offer.mainImage?.url ?? undefined}`. Add the `position` prop right after `imageUrl`:

```tsx
<OfferListCard
  imageUrl={
    isExpandedDoc<OfferUpload>(offer.mainImage)
      ? (offer.mainImage?.url ?? undefined)
      : undefined
  }
  position={
    isExpandedDoc<OfferUpload>(offer.mainImage)
      ? {
          focalX: offer.mainImage.focalX ?? undefined,
          focalY: offer.mainImage.focalY ?? undefined,
          zoom: offer.mainImage.zoom ?? undefined,
        }
      : null
  }
  title={offer.title}
  description={offer.shortDescription}
  ...
/>
```

`isExpandedDoc` is already imported in this file (used for `imageUrl`).

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard/index.tsx" "src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/index.tsx"
git commit -m "refactor(ogloszenia): OfferListCard accepts position prop"
```

---

### Task 9: Swap public offer hero — extend HighImpactHero / Background / BackgroundImage

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferHero/index.tsx`
- Modify: `src/heros/HighImpact/index.tsx`
- Modify: `src/heros/HighImpact/Background/index.tsx`
- Modify: `src/components/heros/BackgroundImage/index.tsx`

The public offer hero pipes `OfferUpload → Media-like shim → HighImpactHero → Background → BackgroundImage → <Image>`. We thread an optional `backgroundImagePosition` through that pipeline; when undefined, every consumer stays at today's behavior.

- [ ] **Step 1: Extend `BackgroundImage` to accept + apply position**

In `src/components/heros/BackgroundImage/index.tsx`, replace the file contents with:

```tsx
'use client'

import { Media } from '@/payload-types'
import { useState } from 'react'
import { PositionedImage } from '@/components/image-position/PositionedImage'
import type { ImagePosition } from '@/components/image-position/types'

interface BackgroundImageProps {
  backgroundImage: Media
  position?: Partial<ImagePosition> | null
}

export default function BackgroundImage({ backgroundImage, position }: BackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div
      className="absolute inset-0 z-0 animate-zoom-in will-change-transform transform-gpu backface-hidden"
      style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
    >
      <PositionedImage
        src={backgroundImage.url || ''}
        alt={backgroundImage.alt || ''}
        position={position}
        className="absolute inset-0"
        priority
        quality={90}
        sizes="100vw"
        onLoad={() => setIsLoaded(true)}
      />
      {/* Inset shadow overlay */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 4px 61.4px rgba(0, 0, 0, 0.5)' }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Extend `HighImpact/Background/index.tsx` to forward position**

Read the file first: `cat src/heros/HighImpact/Background/index.tsx`. Find the line that renders `<BackgroundImage backgroundImage={…}>` and extend it to also pass a new `backgroundImagePosition` prop. At the top of the file, the existing props interface needs an additional optional field:

```tsx
import type { Media } from '@/payload-types'
import type { ImagePosition } from '@/components/image-position/types'
```

Extend the component's props (keep existing ones):

```tsx
interface BackgroundProps {
  backgroundImage?: Media | null
  backgroundVideo?: /* existing type */
  lightBackgroundImage?: Media | null
  lightBackgroundVideo?: /* existing type */
  backgroundImagePosition?: Partial<ImagePosition> | null
}
```

When invoking `<BackgroundImage backgroundImage={…}>`, also pass `position={backgroundImagePosition}`. Leave the light-variant branch unchanged (pages don't use positioning — `backgroundImagePosition` defaults to undefined and `resolvePosition` produces today's behavior).

- [ ] **Step 3: Extend `HighImpactHero` index to accept + forward position**

In `src/heros/HighImpact/index.tsx`, the current definition (read earlier in this plan) is:

```tsx
type HighImpactHeroProps = Page['hero'] & {
  children?: React.ReactNode
}
```

Extend to:

```tsx
import type { ImagePosition } from '@/components/image-position/types'

type HighImpactHeroProps = Page['hero'] & {
  children?: React.ReactNode
  backgroundImagePosition?: Partial<ImagePosition> | null
}
```

Destructure `backgroundImagePosition` alongside the existing props and pass it into `<Background>`:

```tsx
<Background
  backgroundImage={backgroundImage}
  backgroundVideo={backgroundVideo}
  lightBackgroundImage={lightBackgroundImage}
  lightBackgroundVideo={lightBackgroundVideo}
  backgroundImagePosition={backgroundImagePosition}
/>
```

Pages rendering heroes do not pass `backgroundImagePosition` → undefined → defaults → identical rendering. No change in behavior for pages.

- [ ] **Step 4: Update `OfferHero` shim to pass position**

In `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferHero/index.tsx`, current contents pass a Media-shaped shim but drop focalX/Y/zoom. Replace with:

```tsx
import { Media, Offer, OfferUpload } from '@/payload-types'
import { HighImpactHero } from '@/heros/HighImpact'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { OfferHeroContent } from './OfferHeroContent'

interface OfferHeroProps {
  offer: Offer
}

export const OfferHero: React.FC<OfferHeroProps> = ({ offer }) => {
  // Use backgroundImage if provided, otherwise fall back to mainImage
  const backgroundImage = offer.backgroundImage || offer.mainImage

  // Convert OfferUpload to Media-like format for HighImpactHero
  const heroBackgroundImage: Partial<Media> | null = isExpandedDoc<OfferUpload>(backgroundImage)
    ? {
        url: backgroundImage.url,
        alt: backgroundImage.title || '',
        width: backgroundImage.width,
        height: backgroundImage.height,
      }
    : null

  // Position only applies when the background is an OfferUpload (i.e. mainImage
  // fallback, or a backgroundImage sourced from offer-uploads). If backgroundImage
  // is a separately-uploaded Media doc without focal data, defaults apply.
  const heroBackgroundImagePosition = isExpandedDoc<OfferUpload>(backgroundImage)
    ? {
        focalX: backgroundImage.focalX ?? undefined,
        focalY: backgroundImage.focalY ?? undefined,
        zoom: backgroundImage.zoom ?? undefined,
      }
    : null

  const title = offer.title.length > 80 ? `${offer.title.slice(0, 80)}…` : offer.title

  return (
    <HighImpactHero
      backgroundImage={heroBackgroundImage as Media}
      backgroundImagePosition={heroBackgroundImagePosition}
      title={title}
    >
      <OfferHeroContent offer={offer} title={title} />
    </HighImpactHero>
  )
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/heros/BackgroundImage/index.tsx src/heros/HighImpact/Background/index.tsx src/heros/HighImpact/index.tsx "src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferHero/index.tsx"
git commit -m "refactor(hero): thread image position through HighImpactHero pipeline"
```

---

### Task 10: PR 1 verification + push

- [ ] **Step 1: Full typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors attributable to PR 1 work.

- [ ] **Step 2: Unit tests**

Run: `pnpm run test:int`
Expected: all tests pass, including the new `position-styles.int.spec.ts` suite.

- [ ] **Step 3: Manual dev verification**

If the dev server isn't already running: `pnpm dev`. Then:

- Open `/pl/panel/oferty` — offer list thumbnails render as before.
- Open `/pl/panel/oferty/<slug>` — panel detail hero renders as before.
- Open `/pl/ogloszenia` — public list cards render as before.
- Open `/pl/ogloszenia/<slug>` — public hero renders as before.

For an offer with `focalX`, `focalY`, or `zoom` values in the DB (if any), visual changes can appear — expected. For offers with all three null/default, rendering is pixel-identical.

- [ ] **Step 4: Push PR 1**

```bash
git push
```

PR 1 is now live. Before starting PR 2, let Vercel finish the deploy and sanity-check production.

---

# PR 2 — Editor module + entry points

Tasks 11–18. Ships the `<ImagePositionEditor>` module and wires two entry points.

---

### Task 11: `EditorCanvas.tsx` — drag + wheel + keyboard + focal dot + rule-of-thirds + live region

**Files:**
- Create: `src/components/image-position/EditorCanvas.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/image-position/EditorCanvas.tsx`:

```tsx
'use client'

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import { cn } from '@/lib/utils'
import type { ImagePosition } from './types'

interface EditorCanvasProps {
  imageUrl: string
  position: ImagePosition
  onChange: (next: ImagePosition) => void
}

const ZOOM_STEP = 0.1
const FOCAL_NUDGE = 1
const FOCAL_NUDGE_LARGE = 10
const ZOOM_MIN = 1
const ZOOM_MAX = 3
const FOCAL_MIN = 0
const FOCAL_MAX = 100

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * The main editor canvas. Shows the image at its intrinsic aspect ratio
 * and lets the user place a focal point via drag / keyboard, plus zoom
 * via wheel / keyboard. No focalX/focalY sliders — the canvas IS the 2D
 * control.
 *
 * Accessibility:
 * - role="application", tabIndex=0 so the canvas receives focus.
 * - Arrow keys nudge focal; +/- zoom; 0 resets; Enter confirms (bubbles
 *   up as a key event so the parent dialog can hook it).
 * - The focal dot and rule-of-thirds overlay are aria-hidden.
 * - The parent dialog owns the aria-live announcement.
 */
export function EditorCanvas({ imageUrl, position, onChange }: EditorCanvasProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)

  const updateFocalFromPointer = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100
      onChange({
        ...position,
        focalX: clamp(x, FOCAL_MIN, FOCAL_MAX),
        focalY: clamp(y, FOCAL_MIN, FOCAL_MAX),
      })
    },
    [onChange, position],
  )

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      isDragging.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      updateFocalFromPointer(event)
    },
    [updateFocalFromPointer],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return
      updateFocalFromPointer(event)
    },
    [updateFocalFromPointer],
  )

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    isDragging.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      onChange({
        ...position,
        zoom: clamp(position.zoom + delta, ZOOM_MIN, ZOOM_MAX),
      })
    },
    [onChange, position],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? FOCAL_NUDGE_LARGE : FOCAL_NUDGE
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          onChange({ ...position, focalX: clamp(position.focalX - step, FOCAL_MIN, FOCAL_MAX) })
          return
        case 'ArrowRight':
          event.preventDefault()
          onChange({ ...position, focalX: clamp(position.focalX + step, FOCAL_MIN, FOCAL_MAX) })
          return
        case 'ArrowUp':
          event.preventDefault()
          onChange({ ...position, focalY: clamp(position.focalY - step, FOCAL_MIN, FOCAL_MAX) })
          return
        case 'ArrowDown':
          event.preventDefault()
          onChange({ ...position, focalY: clamp(position.focalY + step, FOCAL_MIN, FOCAL_MAX) })
          return
        case '+':
        case '=':
          event.preventDefault()
          onChange({ ...position, zoom: clamp(position.zoom + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) })
          return
        case '-':
        case '_':
          event.preventDefault()
          onChange({ ...position, zoom: clamp(position.zoom - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) })
          return
        case '0':
          event.preventDefault()
          onChange({ focalX: 50, focalY: 50, zoom: 1 })
          return
      }
    },
    [onChange, position],
  )

  // Prevent the browser's default wheel-scroll when the canvas has focus
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const stop = (e: Event) => e.preventDefault()
    el.addEventListener('wheel', stop, { passive: false })
    return () => el.removeEventListener('wheel', stop)
  }, [])

  return (
    <div
      ref={ref}
      role="application"
      tabIndex={0}
      aria-label="Kadr zdjęcia — przeciągnij, aby ustawić punkt główny"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative w-fit max-w-full max-h-[420px] mx-auto rounded-lg overflow-hidden',
        'bg-muted cursor-grab active:cursor-grabbing',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      {/* Intrinsic-aspect image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="block max-w-full max-h-[420px] w-auto h-auto select-none pointer-events-none"
      />

      {/* Rule-of-thirds overlay */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border-y border-dashed border-white/25" style={{ top: '33.33%', bottom: '66.66%' }} />
        <div className="absolute inset-0 border-y border-dashed border-white/25" style={{ top: '66.66%', bottom: '33.33%' }} />
        <div className="absolute inset-0 border-x border-dashed border-white/25" style={{ left: '33.33%', right: '66.66%' }} />
        <div className="absolute inset-0 border-x border-dashed border-white/25" style={{ left: '66.66%', right: '33.33%' }} />
      </div>

      {/* Focal dot */}
      <div
        aria-hidden="true"
        className="absolute size-4 -mt-2 -ml-2 rounded-full bg-accent border-2 border-white shadow-lg pointer-events-none"
        style={{ top: `${position.focalY}%`, left: `${position.focalX}%` }}
      />
    </div>
  )
}
```

Note the use of a plain `<img>` — this is deliberate so the canvas shows the image at its intrinsic aspect ratio without `next/image` imposing a fill container. The `eslint-disable-next-line @next/next/no-img-element` comment documents the exception. The image is purely for framing reference — the actual production rendering uses `PositionedImage` (with `next/image` optimization) via the preview panel.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/image-position/EditorCanvas.tsx
git commit -m "feat(image-position): EditorCanvas with drag, wheel, keyboard"
```

---

### Task 12: `EditorZoomSlider.tsx`

**Files:**
- Create: `src/components/image-position/EditorZoomSlider.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/image-position/EditorZoomSlider.tsx`:

```tsx
'use client'

import { Slider } from '@/components/ui/slider'

interface EditorZoomSliderProps {
  zoom: number
  onChange: (next: number) => void
}

/**
 * Single zoom slider — no focalX/focalY sliders; the canvas drag/keyboard
 * is the 2D control.
 */
export function EditorZoomSlider({ zoom, onChange }: EditorZoomSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor="image-position-zoom" className="text-muted-foreground">
          Przybliżenie
        </label>
        <span className="tabular-nums font-medium">{zoom.toFixed(1)}×</span>
      </div>
      <Slider
        id="image-position-zoom"
        min={1}
        max={3}
        step={0.1}
        value={[zoom]}
        onValueChange={(values) => onChange(values[0])}
      />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/image-position/EditorZoomSlider.tsx
git commit -m "feat(image-position): EditorZoomSlider"
```

---

### Task 13: `EditorPreviewPanel.tsx`

**Files:**
- Create: `src/components/image-position/EditorPreviewPanel.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/image-position/EditorPreviewPanel.tsx`:

```tsx
'use client'

import { PositionedImage } from './PositionedImage'
import type { ImagePosition } from './types'

interface EditorPreviewPanelProps {
  imageUrl: string
  position: ImagePosition
}

/**
 * Right column of the editor modal — shows two live previews that re-render
 * whenever focal/zoom changes. Uses the exact PositionedImage component
 * that production surfaces use, so what the user sees here is what ships.
 */
export function EditorPreviewPanel({ imageUrl, position }: EditorPreviewPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Hero na stronie oferty
        </span>
        <div className="relative aspect-[21/9] overflow-hidden rounded-lg border border-border/40">
          <PositionedImage
            src={imageUrl}
            alt=""
            position={position}
            className="absolute inset-0"
            sizes="500px"
          />
          {/* Bottom band hints where the title sits on the real hero */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black/60 to-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Karta na liście ofert (mobilna)
        </span>
        <div className="relative w-full max-w-[200px] aspect-[5/3] overflow-hidden rounded-lg border border-border/40">
          <PositionedImage
            src={imageUrl}
            alt=""
            position={position}
            className="absolute inset-0"
            sizes="200px"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/image-position/EditorPreviewPanel.tsx
git commit -m "feat(image-position): EditorPreviewPanel with hero + list previews"
```

---

### Task 14: `ImagePositionEditor.tsx` — Dialog + state + save flow

**Files:**
- Create: `src/components/image-position/ImagePositionEditor.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/image-position/ImagePositionEditor.tsx`:

```tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { EditorCanvas } from './EditorCanvas'
import { EditorZoomSlider } from './EditorZoomSlider'
import { EditorPreviewPanel } from './EditorPreviewPanel'
import { DEFAULT_POSITION, resolvePosition, type ImagePosition } from './types'

type Result = { ok: true } | { ok: false; error: string }

interface ImagePositionEditorProps {
  imageUrl: string
  initialPosition?: Partial<ImagePosition> | null
  onConfirm: (position: ImagePosition) => Promise<Result> | Result
  /** Uncontrolled: the child becomes the DialogTrigger. */
  children?: ReactNode
  /** Controlled — optional. If provided, the editor is controlled. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function formatLiveRegion(position: ImagePosition): string {
  return `Punkt główny: poziom ${Math.round(position.focalX)}%, pion ${Math.round(position.focalY)}%, przybliżenie ${Math.round(position.zoom * 100)}%`
}

export function ImagePositionEditor({
  imageUrl,
  initialPosition,
  onConfirm,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ImagePositionEditorProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = useCallback(
    (next: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(next)
      } else {
        setUncontrolledOpen(next)
      }
    },
    [controlledOnOpenChange, isControlled],
  )

  const initial = useMemo(() => resolvePosition(initialPosition), [initialPosition])
  const [position, setPosition] = useState<ImagePosition>(initial)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState<string>(formatLiveRegion(initial))
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset local state whenever the dialog opens with fresh inputs
  useEffect(() => {
    if (open) {
      setPosition(initial)
      setErrorMessage(null)
      setLiveMessage(formatLiveRegion(initial))
    }
  }, [open, initial])

  // Debounce live-region updates so screen readers don't spam on drag
  useEffect(() => {
    if (liveTimer.current) clearTimeout(liveTimer.current)
    liveTimer.current = setTimeout(() => {
      setLiveMessage(formatLiveRegion(position))
    }, 500)
    return () => {
      if (liveTimer.current) clearTimeout(liveTimer.current)
    }
  }, [position])

  const handleReset = useCallback(() => {
    setPosition(DEFAULT_POSITION)
    setErrorMessage(null)
  }, [])

  const handleSave = useCallback(async () => {
    setIsPending(true)
    setErrorMessage(null)
    try {
      const result = await onConfirm(position)
      if (result.ok) {
        setOpen(false)
      } else {
        setErrorMessage(result.error)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Nie udało się zapisać kadru')
    } finally {
      setIsPending(false)
    }
  }, [onConfirm, position, setOpen])

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="max-w-5xl w-full"
        // Block Escape and outside-click while saving
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (isPending) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Dostosuj kadr głównego zdjęcia</DialogTitle>
          <DialogDescription>
            Przeciągnij na zdjęciu, aby ustawić punkt główny. Użyj rolki lub suwaka, aby przybliżyć.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-4 md:gap-6">
          <div className="flex flex-col gap-3">
            <EditorCanvas imageUrl={imageUrl} position={position} onChange={setPosition} />
            <EditorZoomSlider
              zoom={position.zoom}
              onChange={(zoom) => setPosition((p) => ({ ...p, zoom }))}
            />
          </div>
          <EditorPreviewPanel imageUrl={imageUrl} position={position} />
        </div>

        {/* aria-live region for screen readers */}
        <div className="sr-only" aria-live="polite">{liveMessage}</div>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleReset} disabled={isPending}>
            Wyśrodkuj
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Anuluj
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              Zapisz kadr
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/image-position/ImagePositionEditor.tsx
git commit -m "feat(image-position): ImagePositionEditor modal"
```

---

### Task 15: Server action `updateOfferUploadPosition`

**Files:**
- Create: `src/actions/panel/offer-uploads.ts`

- [ ] **Step 1: Create the file**

Create `src/actions/panel/offer-uploads.ts`:

```ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import type { ImagePosition } from '@/components/image-position/types'
import { resolvePosition } from '@/components/image-position/types'

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

/**
 * Updates the focal + zoom values on an offer upload.
 *
 * The OfferUploads collection's access config references a non-existent
 * `uploadedBy` field, so collection-level `update` access is effectively
 * broken for non-admins. This action performs ownership enforcement
 * manually (admin/moderator OR the user who uploaded the doc).
 */
export async function updateOfferUploadPosition(
  uploadId: number,
  position: ImagePosition,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const sessionUser = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const user = await payload.findByID({
      collection: 'users',
      id: Number(sessionUser.id),
      depth: 0,
    })
    if (!user) return { success: false, error: 'Brak uprawnień' }

    const upload = await payload.findByID({
      collection: 'offer-uploads',
      id: uploadId,
      depth: 0,
      overrideAccess: true,
    })

    const ownerId =
      upload && typeof upload.user === 'object'
        ? upload.user?.id
        : (upload?.user as number | undefined)

    const isOwner = ownerId === user.id
    const isPrivileged = user.role === 'admin' || user.role === 'moderator'

    if (!isOwner && !isPrivileged) {
      return { success: false, error: 'Brak uprawnień do edycji tego zdjęcia' }
    }

    // Clamp + normalize at the boundary
    const clamped = resolvePosition(position)

    await payload.update({
      collection: 'offer-uploads',
      id: uploadId,
      data: {
        focalX: clamped.focalX,
        focalY: clamped.focalY,
        zoom: clamped.zoom,
      },
      overrideAccess: true,
    })

    // Refresh every surface that displays the main image
    revalidatePath('/panel/oferty')
    revalidatePath('/panel/oferty/[slug]', 'page')
    revalidatePath('/[lang]/ogloszenia', 'page')
    revalidatePath('/[lang]/ogloszenia/[slug]', 'page')

    return { success: true }
  } catch (err) {
    console.error('[updateOfferUploadPosition]', err)
    return { success: false, error: 'Nie udało się zapisać kadru' }
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/panel/offer-uploads.ts
git commit -m "feat(actions): updateOfferUploadPosition server action"
```

---

### Task 16: Wire wizard entry point — "Dostosuj kadr" in SingleImageUpload

**Files:**
- Modify: `src/components/panel/wizard/FileUpload.tsx`
- Modify: `src/components/panel/wizard/OfferWizardForm.tsx`

- [ ] **Step 1: Extend the `UploadedFile` interface to carry position**

In `src/components/panel/wizard/OfferWizardForm.tsx`, find the `UploadedFile` interface declaration (near the top of the component body, inside `OfferWizardForm`):

```tsx
interface UploadedFile { id: number; url: string; filename: string }
```

Extend to:

```tsx
interface UploadedFile {
  id: number
  url: string
  filename: string
  focalX?: number | null
  focalY?: number | null
  zoom?: number | null
}
```

Update the two `useState<UploadedFile | null>` initializers (for `mainImage` and `backgroundImage`) to carry the three new fields when `initialData` provides them. Find code like:

```tsx
const [mainImage, setMainImage] = useState<UploadedFile | null>(
  initialData?.mainImage && typeof initialData.mainImage === 'object'
    ? { id: initialData.mainImage.id, url: initialData.mainImage.url ?? '', filename: initialData.mainImage.filename ?? '' }
    : null,
)
```

And extend the object:

```tsx
const [mainImage, setMainImage] = useState<UploadedFile | null>(
  initialData?.mainImage && typeof initialData.mainImage === 'object'
    ? {
        id: initialData.mainImage.id,
        url: initialData.mainImage.url ?? '',
        filename: initialData.mainImage.filename ?? '',
        focalX: initialData.mainImage.focalX ?? null,
        focalY: initialData.mainImage.focalY ?? null,
        zoom: initialData.mainImage.zoom ?? null,
      }
    : null,
)
```

Do the same for `backgroundImage` if its `UploadedFile` also reads from the same collection (check the file — gallery items have different shapes; only single-image uploads need this change).

- [ ] **Step 2: Add the "Dostosuj kadr" button to `SingleImageUpload`**

Read `src/components/panel/wizard/FileUpload.tsx`. Find the `SingleImageUpload` component's "uploaded preview" branch (the block that renders when `value?.url` is truthy, showing the image plus the pencil + X control row).

Add these imports at the top:

```tsx
import { CropIcon } from 'lucide-react'
import { ImagePositionEditor } from '@/components/image-position/ImagePositionEditor'
import type { ImagePosition } from '@/components/image-position/types'
import { updateOfferUploadPosition } from '@/actions/panel/offer-uploads'
```

Extend `SingleImageUpload`'s props to opt into the editor:

```tsx
interface SingleImageUploadProps {
  value: UploadedFile | null
  onChange: (file: UploadedFile | null) => void
  label?: string
  required?: boolean
  /** Show the "Dostosuj kadr" button on the uploaded preview. */
  allowEditPosition?: boolean
}
```

Also extend `UploadedFile` (the local interface inside this file) to mirror the fields added in Step 1:

```tsx
interface UploadedFile {
  id: number
  url: string
  filename: string
  focalX?: number | null
  focalY?: number | null
  zoom?: number | null
}
```

In the "uploaded preview" branch, after the existing Change / Remove controls, add the editor trigger. For the desktop overlay row:

```tsx
{allowEditPosition && value && (
  <ImagePositionEditor
    imageUrl={value.url}
    initialPosition={{
      focalX: value.focalX ?? undefined,
      focalY: value.focalY ?? undefined,
      zoom: value.zoom ?? undefined,
    }}
    onConfirm={async (position: ImagePosition) => {
      const res = await updateOfferUploadPosition(value.id, position)
      if (res.success) {
        onChange({
          ...value,
          focalX: position.focalX,
          focalY: position.focalY,
          zoom: position.zoom,
        })
        return { ok: true as const }
      }
      return { ok: false as const, error: res.error }
    }}
  >
    <button
      type="button"
      aria-label="Dostosuj kadr"
      className="inline-flex size-9 items-center justify-center rounded-full bg-black/70 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-accent"
    >
      <CropIcon className="size-4" />
    </button>
  </ImagePositionEditor>
)}
```

Insert the desktop block above inside the `absolute right-2 top-2 flex gap-1.5` desktop-controls container (next to the existing Pencil button). Then add a SECOND `<ImagePositionEditor>` instance inside the mobile-controls row below the image (the `flex sm:hidden` block), with identical props but a wider, labeled trigger:

```tsx
{allowEditPosition && value && (
  <ImagePositionEditor
    imageUrl={value.url}
    initialPosition={{
      focalX: value.focalX ?? undefined,
      focalY: value.focalY ?? undefined,
      zoom: value.zoom ?? undefined,
    }}
    onConfirm={async (position: ImagePosition) => {
      const res = await updateOfferUploadPosition(value.id, position)
      if (res.success) {
        onChange({
          ...value,
          focalX: position.focalX,
          focalY: position.focalY,
          zoom: position.zoom,
        })
        return { ok: true as const }
      }
      return { ok: false as const, error: res.error }
    }}
  >
    <button
      type="button"
      aria-label="Dostosuj kadr"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border/40 bg-background px-4 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <CropIcon className="size-4" />
      Dostosuj kadr
    </button>
  </ImagePositionEditor>
)}
```

Two editor instances is fine — only one is visible at a time due to the `sm:hidden` / `hidden sm:flex` media queries on the wrapper rows, and each instance owns its own dialog state independently.

- [ ] **Step 3: Enable `allowEditPosition` on the main image in the wizard**

In `src/components/panel/wizard/steps/StepMedia.tsx`, the main image `SingleImageUpload` is rendered once. Set `allowEditPosition` on it (do NOT enable for the background image in V1):

```tsx
<SingleImageUpload
  value={mainImage}
  onChange={onMainImageChange}
  label="Kliknij lub przeciągnij zdjęcie główne"
  required
  allowEditPosition
/>
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/panel/wizard/FileUpload.tsx src/components/panel/wizard/OfferWizardForm.tsx src/components/panel/wizard/steps/StepMedia.tsx
git commit -m "feat(wizard): Dostosuj kadr button on main image"
```

---

### Task 17: Panel detail view entry point — floating edit button on hero

**Files:**
- Modify: `src/components/panel/oferty/OfferDetailView.tsx`

- [ ] **Step 1: Add imports**

Add to the import block at the top of `src/components/panel/oferty/OfferDetailView.tsx`:

```tsx
import { CropIcon } from 'lucide-react'
import { ImagePositionEditor } from '@/components/image-position/ImagePositionEditor'
import type { ImagePosition } from '@/components/image-position/types'
import { updateOfferUploadPosition } from '@/actions/panel/offer-uploads'
```

- [ ] **Step 2: Make the component client-only for the router refresh hook**

At the top of the file, before imports, add:

```tsx
'use client'
```

(The component currently runs as a server component. The edit button needs client state via the editor's trigger; making the whole view client is the simplest path and matches how other interactive panel pages already work. Double-check nothing in this file uses `async` as a component or awaits a server call at render — a quick grep confirms only the parent `page.tsx` does the fetching.)

Add the `useRouter` hook near the top of the component body:

```tsx
import { useRouter } from 'next/navigation'
// ...
export function OfferDetailView({ offer, lang }: OfferDetailViewProps) {
  const router = useRouter()
  // ... rest
```

- [ ] **Step 3: Add the edit-position trigger to the hero**

In the 21/9 hero block, inside the outer `<div className="relative aspect-[21/9] …">`, add a trigger positioned top-right (`absolute top-4 right-4 z-10`). Put it AFTER the `<PositionedImage>` / placeholder ternary so it sits above the image. Only render when the offer has a main image upload:

```tsx
{typeof offer.mainImage === 'object' && offer.mainImage && (
  <ImagePositionEditor
    imageUrl={offer.mainImage.url ?? ''}
    initialPosition={{
      focalX: offer.mainImage.focalX ?? undefined,
      focalY: offer.mainImage.focalY ?? undefined,
      zoom: offer.mainImage.zoom ?? undefined,
    }}
    onConfirm={async (position: ImagePosition) => {
      const res = await updateOfferUploadPosition(offer.mainImage.id, position)
      if (res.success) {
        router.refresh()
        return { ok: true as const }
      }
      return { ok: false as const, error: res.error }
    }}
  >
    <button
      type="button"
      aria-label="Dostosuj kadr głównego zdjęcia"
      className="absolute top-4 right-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-black/70 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-accent"
    >
      <CropIcon className="size-5" />
    </button>
  </ImagePositionEditor>
)}
```

Place this trigger as a sibling of the `<PositionedImage>` inside the hero `<div>`, above the gradient overlay.

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/panel/oferty/OfferDetailView.tsx
git commit -m "feat(panel): edit-position button on offer detail hero"
```

---

### Task 18: PR 2 verification + push

- [ ] **Step 1: Full typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no new errors.

- [ ] **Step 2: Unit tests**

Run: `pnpm run test:int`
Expected: all tests pass.

- [ ] **Step 3: Manual QA in dev**

If the dev server isn't already running: `pnpm dev`. Run through:

- **Wizard — create offer, upload main image, click "Dostosuj kadr"**. The modal opens with the source image at its intrinsic aspect in the canvas, the focal dot at center, two previews on the right.
- **Drag** on the canvas — focal dot follows; previews update in real time.
- **Scroll wheel** on canvas — zoom changes; previews reflect the change.
- **Keyboard** — arrows nudge focal by 1%, Shift+arrow by 10%; `+`/`-` adjust zoom; `0` resets.
- **Zapisz kadr** — button shows spinner, dialog closes. Re-opening the editor shows the saved values.
- **Wyśrodkuj** — resets to center without closing.
- **Anuluj** — discards, closes.
- **Screen-reader smoke test** — enable VoiceOver / NVDA; drag on the canvas should announce "Punkt główny: poziom X%, pion Y%, przybliżenie N%" after a short pause.
- **Reduced motion** — emulate `prefers-reduced-motion` in DevTools; the dialog should still open cleanly (no animation regression).
- **Panel offer detail page** — open an offer, click the floating crop icon on the hero. Same modal. Save → hero refreshes with the new position.
- **Public offer page** — hard-reload `/pl/ogloszenia/<slug>`. Hero reflects the saved position. Public list card for the same offer reflects it too.
- **Wizard regression** — create an offer without opening the editor and finish publishing. The offer renders exactly as it did before this PR.

- [ ] **Step 4: Push PR 2**

```bash
git push
```

---

## Post-plan notes

- **No feature flag.** Defaults on `offer-uploads` produce today's rendering exactly, so PR 1 is safe to ship alone.
- **No new runtime deps.** `motion/react`, `next/image`, shadcn, lucide-react are all already installed.
- **Analytics.** No tracking hooks inserted (the project doesn't ship analytics today).
- **Future.** The editor is image-URL-agnostic. Reusing it for background image, gallery items, or video thumbnails is new-caller-only — no module changes needed.
