# Image Position Editor

**Date**: 2026-04-23
**Scope**: A reusable `<ImagePositionEditor />` modal + `<PositionedImage />` display wrapper that lets users drag and zoom a focal point on an uploaded main image, with live previews of the two most visible display surfaces (21/9 hero and list card thumbnail). Stores the position on the `offer-uploads` doc as focal point + zoom.

## Problem

The main image on every offer is rendered across six surfaces in four distinct aspect ratios (21/9 hero, tall list thumbnail, short map pin, carousel tile). Each uses raw `object-cover` with no input from the owner. The subject frequently lands in an awkward spot (cropped faces on tall cards, unbalanced framing on the hero). Today there is no way for the service provider to control how their image is cropped — they can only re-upload.

We want:

- A single editor UI with a canvas + live previews.
- Focal point and zoom controlled by drag / sliders / scroll.
- The same stored value driving every surface, so edits propagate everywhere.
- A modular implementation that the rest of the codebase doesn't know about — consumers swap `<Image>` for `<PositionedImage>` and that's it.

## Non-goals

- Per-surface crop rectangles (rejected during brainstorming — massive maintenance cost).
- Server-side image re-rasterization (CSS transforms are sufficient; no generation pipeline needed).
- Payload admin editor UI (admins use the wizard via offer edit mode).
- Editing the backgroundImage, gallery, or video thumbnail (out of scope for V1; the module is ready to accept those later).
- A pinch-gesture library beyond browser-native pointer events.

## Data model

### `offer-uploads` collection

Two fields already exist, unused. One field is new.

```ts
focalX?: number | null   // 0 – 1, horizontal focal point (0 = left, 1 = right)
focalY?: number | null   // 0 – 1, vertical focal point (0 = top, 1 = bottom)
zoom?:   number | null   // 1.0 – 3.0, scale multiplier
```

Defaults when missing / null: `focalX = 0.5`, `focalY = 0.5`, `zoom = 1`. Every existing offer renders identically to today when all three are unset.

### Migration

One targeted, idempotent migration per `eventizer-payload-migrations`:

```sql
ALTER TABLE "offer_uploads"
  ADD COLUMN IF NOT EXISTS "zoom" numeric DEFAULT 1;
ALTER TABLE "_offer_uploads_v"
  ADD COLUMN IF NOT EXISTS "version_zoom" numeric DEFAULT 1;
```

(`focalX` / `focalY` columns already exist from Payload's focal-point primitive — unused until now.)

### Shared types

```ts
// src/components/panel/image-editor/types.ts
export interface ImagePosition {
  focalX: number   // clamped 0 – 1
  focalY: number   // clamped 0 – 1
  zoom: number     // clamped 1 – 3
}

export const DEFAULT_POSITION: ImagePosition = {
  focalX: 0.5,
  focalY: 0.5,
  zoom: 1,
}

export function resolvePosition(
  raw: Partial<ImagePosition> | null | undefined,
): ImagePosition
```

`resolvePosition` clamps and fills defaults. Every display-time consumer calls it so invariants hold against dirty DB data.

## Module structure

```
src/components/panel/image-editor/
  ImagePositionEditor.tsx     — shadcn Dialog + local state + save handling
  EditorCanvas.tsx            — image, focal dot, pointer/wheel handling
  EditorControls.tsx          — three sliders (zoom / focalX / focalY)
  EditorPreviewPanel.tsx      — 21/9 hero + tall list card previews
  PositionedImage.tsx         — display-time wrapper used at every surface
  positionStyles.ts           — pure helper: ImagePosition → CSS styles
  positionStyles.test.ts      — unit tests
  types.ts                    — ImagePosition, DEFAULT_POSITION, resolvePosition
  index.ts                    — barrel; exports only the two public components + types
```

Only `ImagePositionEditor`, `PositionedImage`, and the types leave the folder. Everything else is module-internal. That's the "separation of concerns" the user asked for — callers never touch canvas / slider / preview code.

## Public APIs

### `<ImagePositionEditor />`

```tsx
interface ImagePositionEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string                           // full-resolution source
  initialPosition?: Partial<ImagePosition>   // existing stored values
  onSave: (position: ImagePosition) => Promise<void> | void
}
```

Behavior:

- Opens a shadcn `Dialog` (`max-w-5xl`) containing the canvas + controls on the left and two previews on the right.
- Internal `useState<ImagePosition>` initialized from `resolvePosition(initialPosition)`.
- **Zapisz pozycję**: calls `onSave(position)`; button shows spinner until the promise resolves; dialog closes on success.
- **Przywróć domyślne**: resets local state to `DEFAULT_POSITION`; does not close.
- **Anuluj**: discards local state; closes via `onOpenChange(false)`.
- Consumer owns persistence — the modal does not know about server actions.

### `<PositionedImage />`

```tsx
interface PositionedImageProps {
  src: string
  alt: string
  position?: Partial<ImagePosition> | null
  className?: string                         // applied to the outer wrapper
  priority?: boolean                         // forwarded to next/image
  sizes?: string                             // forwarded to next/image
}
```

Renders a `relative overflow-hidden` wrapper with `className` applied, containing a `next/image` with `fill`, `object-cover`, and the styles from `positionStyles(resolvePosition(position))`. Swap-in for existing `<Image fill className="object-cover" />` usages is a 1-line change at each site.

## Display-time math

```ts
// positionStyles.ts
import type { CSSProperties } from 'react'
import type { ImagePosition } from './types'

export function positionStyles(position: ImagePosition): CSSProperties {
  const { focalX, focalY, zoom } = position
  return {
    objectFit: 'cover',
    objectPosition: `${focalX * 100}% ${focalY * 100}%`,
    transform: zoom > 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${focalX * 100}% ${focalY * 100}%`,
    willChange: zoom > 1 ? 'transform' : undefined,
  }
}
```

Rationale:

- `object-cover` already crops based on container aspect ratio.
- `object-position: {x}% {y}%` tells `object-cover` which part of the image to favor.
- `transform: scale(z)` pushes further in beyond what `object-cover` does.
- `transform-origin` at the same focal keeps the subject stable during zoom-in.

The math is aspect-ratio-agnostic. Each display surface just sets its own container shape via `className`; the image adapts automatically.

## Editor canvas behavior

- **Drag**: `pointerdown` + `pointermove` on the canvas updates `focalX`/`focalY` as the clicked-and-dragged position.
- **Wheel**: scroll up increments zoom by 0.1 (clamped to 1–3); scroll down decrements.
- **Pinch**: standard two-finger gesture raises `wheel` events in modern mobile browsers; no extra library.
- **Sliders**: three shadcn `Slider` components beneath the canvas as the fallback/desktop-aware control — also the primary interaction on small viewports.
- **Focal dot**: visual marker on the canvas, positioned by CSS `top/left` from the current focal values. Non-interactive (the canvas itself is the hit target).
- **Rule-of-thirds guides**: dashed grid overlay on the canvas for framing reference.

## Preview panel

Two stacked surfaces inside the dialog's right column:

1. **21/9 hero** — `<PositionedImage>` in a `aspect-[21/9]` container, no max-width.
2. **Tall list thumbnail** — `<PositionedImage>` in a `aspect-[4/5]` container capped at `w-40` to roughly match the panel list card width.

Both subscribe to the editor's live `ImagePosition` state; updating the canvas or a slider causes immediate re-render via CSS change.

Carousel / featured-offers / map pin previews are **not** included in the editor — confirmed during brainstorming. Those surfaces still render through `<PositionedImage>` at display time (or keep their current raw `<img>` / `<Image>` — swap is optional) and pick up positioning if it's been set.

## Server action

```ts
// src/actions/panel/offer-uploads.ts
'use server'
export async function updateOfferUploadPosition(
  uploadId: number,
  position: ImagePosition,
): Promise<{ success: true } | { success: false; error: string }>
```

- Authenticated via `getAuthenticatedUser()` (per `eventizer-server-actions`).
- Verifies the current user owns the upload OR is admin / moderator.
- Calls `payload.update({ collection: 'offer-uploads', id, data: { focalX, focalY, zoom } })`.
- Returns the `{ success, data/error }` shape.
- `revalidatePath('/panel/oferty')` + `revalidatePath('/ogloszenia/[slug]', 'page')` so list + hero re-render with the new position.

## Entry points

### Wizard media step

`src/components/panel/wizard/FileUpload.tsx` `SingleImageUpload` (main image): add an "Edytuj pozycję" button beside the existing pencil + trash controls on the uploaded preview. Opens `<ImagePositionEditor>` with the current upload's position. `onSave` calls `updateOfferUploadPosition(mainImage.id, position)` + updates the local `UploadedFile` state with the new values.

Only shown on the main image — not on gallery items or the background image (YAGNI; those can adopt the same pattern later by reusing the module).

### Panel offer detail view

`src/components/panel/oferty/OfferDetailView.tsx` hero: a floating icon button (top-right, `CropIcon` from lucide) that opens the editor with the current offer's main image + stored position. `onSave` calls the same server action and `router.refresh()` so the hero + info grid re-render.

Only visible to the offer owner (admin/moderator/owner) — matches who can edit the offer itself.

## Display-surface consumers (call-site swaps)

Replace raw `<Image fill className="object-cover" />` with `<PositionedImage position={offer.mainImage?.…}>` at these surfaces:

1. `OfferCard` (panel list) — `src/components/panel/oferty/OfferCard.tsx`
2. `OfferListCard` (public list) — `src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard/index.tsx`
3. `OfferDetailView` hero (panel) — `src/components/panel/oferty/OfferDetailView.tsx`
4. HighImpact hero background — `src/heros/HighImpact/Background/index.tsx` (or wherever the public offer hero consumes the image)

Carousel and map pin are **not** swapped in V1. They keep their current raw rendering (defaults apply — center, no zoom — which matches today's behavior exactly).

Each consumer must fetch the upload with `depth >= 1` so `offer.mainImage` is the populated `OfferUpload` object containing `focalX` / `focalY` / `zoom`. Verify at each call site that the existing query already does this.

## Edge cases

- **Missing image**: `<PositionedImage>` renders its caller-provided `className` container with a muted placeholder (`bg-muted`), regardless of position values.
- **Dirty stored data** (e.g. `focalX = 1.5`, `zoom = -1`): `resolvePosition` clamps values before they reach the DOM.
- **Unsaved changes + Cancel**: local state is discarded; the stored position is untouched.
- **Save fails**: the action returns `{ success: false, error }`; the modal toasts the error and stays open so the user can retry.
- **Prefers-reduced-motion**: the dialog's open/close animation is shadcn's default (respects the CSS media query). Canvas drag/zoom are direct manipulation — no animations to guard.
- **SSR**: the editor is `'use client'`. `PositionedImage` is also client-only because it wraps `next/image`; this matches how current consumers use `next/image`. No server-component changes required.
- **Mobile**: sliders are the primary interaction. Dragging on the canvas works via pointer events; pinch-zoom raises `wheel` events that the canvas handles the same way as mouse scroll.

## Testing

Single unit test file: `positionStyles.test.ts`.

Cases:
1. `DEFAULT_POSITION` → `object-position: 50% 50%`, no `transform`.
2. Off-center focal (0.2 / 0.8 / 1) → `object-position: 20% 80%`, no `transform`.
3. Zoom 2×, focal (0.3 / 0.4) → `transform: scale(2)`, `transform-origin: 30% 40%`.
4. `resolvePosition({})` → `DEFAULT_POSITION`.
5. `resolvePosition({ focalX: 1.5, zoom: 5 })` → clamped `{ focalX: 1, focalY: 0.5, zoom: 3 }`.

No component tests. Editor canvas, slider behavior, preview panel — all exhaustively covered by the pure helper plus manual QA in the wizard + detail view.

## Rollout

Single PR. Tasks in the plan:

1. Migration file + `index.ts` registration.
2. `offer-uploads` collection config — add `zoom` field definition, regenerate payload-types.
3. `types.ts` + `resolvePosition` + `DEFAULT_POSITION`.
4. `positionStyles.ts` + its test file (TDD).
5. `PositionedImage.tsx`.
6. Swap the four display-surface consumers (4 one-liner diffs).
7. `EditorCanvas.tsx` (drag + wheel + focal dot + rule-of-thirds overlay).
8. `EditorControls.tsx` (three shadcn sliders).
9. `EditorPreviewPanel.tsx` (hero + list card previews reusing `PositionedImage`).
10. `ImagePositionEditor.tsx` (Dialog + state orchestration + save flow).
11. `index.ts` barrel.
12. `updateOfferUploadPosition` server action.
13. Entry point: wizard `SingleImageUpload` gets the "Edytuj pozycję" button.
14. Entry point: `OfferDetailView` hero gets the floating edit-position button.
15. Manual QA on dev.

No feature flag, no migration risk for existing data. Every existing offer renders identically on day one because defaults reproduce today's behavior.
