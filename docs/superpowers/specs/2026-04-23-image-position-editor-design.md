# Image Position Editor

**Date**: 2026-04-23
**Revised**: 2026-04-23 (after two review passes — codebase-correctness + design-quality)
**Scope**: A reusable `<ImagePositionEditor />` modal + `<PositionedImage />` display wrapper that lets users frame their main image via focal point + zoom, with live previews of the two most visible display surfaces. Stores the framing on the `offer-uploads` doc, reusing Payload's built-in `focalX`/`focalY` primitive and adding one `zoom` field.

## Problem

The main image on every offer is rendered across six surfaces in four distinct aspect ratios (21/9 hero, tall list thumbnail, short map pin, carousel tile). Each uses raw `object-cover` with no input from the owner. Subjects frequently land in awkward spots. Today there is no way for the owner to control how their image is framed without re-uploading.

We want:

- A single editor UI with a canvas + live previews.
- Framing controlled by drag + zoom wheel + zoom slider, with full keyboard support.
- The same stored value driving every surface, so edits propagate everywhere.
- A modular implementation that the rest of the codebase doesn't need to know about — consumers swap `<Image>` for `<PositionedImage>` and that's it.

## Non-goals

- Per-surface crop rectangles (rejected during brainstorming).
- Server-side image re-rasterization (CSS transforms are sufficient).
- Payload admin editor UI (admins use the wizard via offer edit mode).
- Editing the backgroundImage, gallery, or video thumbnail in V1 (the module is shaped so future callers can reuse the editor for them).
- A pinch-gesture library beyond browser-native pointer/wheel events.
- Analytics/telemetry (the project doesn't ship analytics today).

## Data model

### `offer-uploads` collection

Two fields already exist from Payload's built-in focal-point primitive. One is new.

```ts
focalX?: number | null   // 0 – 100, horizontal focal percentage (Payload convention)
focalY?: number | null   // 0 – 100, vertical focal percentage
zoom?:   number | null   // 1.0 – 3.0, scale multiplier
```

**Scale note**: `focalX`/`focalY` are percentages (0–100) to stay compatible with Payload's built-in focal-point UI and any rows that have ever been touched by it. All display-time helpers and editor state convert to/from the 0–1 range internally but persist as 0–100.

Defaults when any field is null/missing: `focalX = 50`, `focalY = 50`, `zoom = 1` — produces the current centered, unzoomed rendering. Every existing offer renders identically to today when defaults apply.

### Migration

One targeted, idempotent migration adding only the new column:

```sql
ALTER TABLE "offer_uploads"
  ADD COLUMN IF NOT EXISTS "zoom" numeric DEFAULT 1;
```

**No versioned-table ALTER.** `OfferUploads` does not enable `versions: { drafts: true }`; there is no `_offer_uploads_v` table. The baseline migration [20251217_102626_backup_before_switch.ts](../../src/migrations/20251217_102626_backup_before_switch.ts) confirms this — only `offer_uploads` exists.

### Shared types

```ts
// src/components/image-position/types.ts
export interface ImagePosition {
  focalX: number   // clamped 0 – 100
  focalY: number   // clamped 0 – 100
  zoom: number     // clamped 1 – 3
}

export const DEFAULT_POSITION: ImagePosition = {
  focalX: 50,
  focalY: 50,
  zoom: 1,
}

export function resolvePosition(
  raw: Partial<ImagePosition> | null | undefined,
): ImagePosition
```

`resolvePosition` clamps and fills defaults. Every display-time consumer calls it so invariants hold against dirty DB data.

## Module structure

```
src/components/image-position/
  ImagePositionEditor.tsx     — shadcn Dialog + local state + save handling
  EditorCanvas.tsx            — image, focal dot, pointer/wheel/keyboard handling
  EditorZoomSlider.tsx        — single shadcn Slider for zoom (focalX/Y removed)
  EditorPreviewPanel.tsx      — 21/9 hero + list card previews
  PositionedImage.tsx         — display-time wrapper used at every surface
  positionStyles.ts           — pure helper: ImagePosition → CSS styles
  positionStyles.test.ts      — unit tests
  types.ts                    — ImagePosition, DEFAULT_POSITION, resolvePosition
```

No `index.ts` barrel. The Eventizer codebase does not use barrels anywhere under `src/components/**`; callers import directly from the specific file.

**Location note**: `PositionedImage` is used by public surfaces too (list card, public hero), so the module lives at `src/components/image-position/` — not under `panel/`. The editor entry points are still panel-only, but the display wrapper is shared.

Module-public exports:
- `ImagePositionEditor` (from `ImagePositionEditor.tsx`)
- `PositionedImage` (from `PositionedImage.tsx`)
- `ImagePosition`, `DEFAULT_POSITION`, `resolvePosition` (from `types.ts`)

Everything else is module-internal — consumers import one of the above via the file path.

## Public APIs

### `<ImagePositionEditor />`

Supports both controlled and uncontrolled use. Default flow is uncontrolled with a child trigger — matches shadcn Dialog convention and removes duplicate `open`-state bookkeeping at both entry points.

```tsx
type Result = { ok: true } | { ok: false; error: string }

interface ImagePositionEditorProps {
  imageUrl: string
  initialPosition?: Partial<ImagePosition> | null
  onConfirm: (position: ImagePosition) => Promise<Result> | Result
  // Uncontrolled: pass a trigger child that becomes the DialogTrigger
  children?: ReactNode
  // Controlled: optional — caller manages open state
  open?: boolean
  onOpenChange?: (open: boolean) => void
}
```

Behavior:

- Uncontrolled when `children` is provided: wraps the child in `<DialogTrigger asChild>`.
- Internal state initialized via `useState<ImagePosition>(resolvePosition(initialPosition))`.
- **Zapisz kadr**: calls `onConfirm(position)`; button shows spinner while pending. On `{ ok: true }` closes the dialog; on `{ ok: false, error }` renders the error inline beneath the save button; dialog stays open for retry. Close controls (X, backdrop click, Esc) are disabled while `onConfirm` is in flight.
- **Wyśrodkuj**: resets local state to `DEFAULT_POSITION`; does not close.
- **Anuluj**: discards local state; closes.

### `<PositionedImage />`

Pass-through wrapper around `next/image`. Preserves all existing image props so call-site swaps stay 1-line (see Consumer Swaps below for the one exception).

```tsx
import type { ImageProps } from 'next/image'

type PositionedImageProps = Omit<ImageProps, 'src' | 'alt' | 'fill' | 'style'> & {
  src: string
  alt: string
  position?: Partial<ImagePosition> | null
  className?: string        // on outer wrapper
  imgClassName?: string     // on the inner next/image (preserves hover:scale etc.)
}
```

Renders a `relative overflow-hidden` wrapper with `className` applied. Inner `<Image fill>` gets `imgClassName` + `positionStyles(resolvePosition(position))` applied. Consumers still add `hover:scale-105 transition-transform duration-300` etc. via `imgClassName` — **no loss of existing card hover behavior**.

No `'use client'` on `PositionedImage`. It's a thin wrapper over `next/image` (which works in server components); marking it client would needlessly push any RSC consumer (e.g. `OfferDetailView`) into a client subtree.

## Display-time math

```ts
// positionStyles.ts
import type { CSSProperties } from 'react'
import type { ImagePosition } from './types'

export function positionStyles(position: ImagePosition): CSSProperties {
  const { focalX, focalY, zoom } = position
  return {
    objectFit: 'cover',
    objectPosition: `${focalX}% ${focalY}%`,
    transform: zoom > 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${focalX}% ${focalY}%`,
    willChange: zoom > 1 ? 'transform' : undefined,
  }
}
```

Because `focalX`/`focalY` are stored as 0–100, the style values go in directly as percentages.

**Why this works**: under `object-fit: cover`, `object-position: X% Y%` places the image such that the `X%, Y%` point of the image aligns with the `X%, Y%` point of the container. Then `transform: scale(z)` with `transform-origin: X% Y%` scales around that same container point — the subject stays anchored. Confirmed stable across aspect ratios (21/9, 4/5, etc.) in manual testing; the same three values produce consistent subject placement on every surface.

**Known limitation**: `zoom < 1` (zoom-out beyond cover) is not supported — the image would letterbox and `object-cover` wouldn't let it. Slider is clamped to 1–3. This is a deliberate constraint.

## Editor UX

### Canvas

The canvas shows the source image at its **intrinsic aspect ratio** inside a max-sized frame (e.g. `max-h-[420px] max-w-full w-fit mx-auto`). Users position a focal dot on their actual photo — no pre-crop framing choice is imposed. The hero preview on the right answers "what does the 21/9 crop look like given this focal."

Controls:

- **Drag**: `pointerdown` + `pointermove` on the canvas updates `focalX`/`focalY` to the clicked/dragged position (converted to 0–100 %).
- **Wheel**: scroll up/down adjusts zoom by 0.1 per tick (clamped 1–3). Pinch-to-zoom on mobile raises `wheel` events on modern Safari iOS; Android Chrome varies — **the zoom slider is the reliable mobile control.**
- **Keyboard** (canvas `role="application"`, `tabIndex={0}`, visible focus ring):
  - `ArrowLeft/Right/Up/Down` — nudge focal by 1% (10% with Shift).
  - `+` / `-` — zoom ±0.1.
  - `0` — reset to `DEFAULT_POSITION`.
  - `Enter` — confirm (same as clicking Zapisz kadr).
  - `Escape` — cancel (Dialog default).
- **Focal dot**: visual marker `aria-hidden="true"`, positioned via CSS `top/left`.
- **Rule-of-thirds overlay**: always on, `aria-hidden="true"`. Low-opacity dashed guide; costs nothing, useful framing reference.
- **Live region**: visually-hidden `<div aria-live="polite">` within the dialog announces the current position on a 500 ms debounce — e.g. "Punkt główny: poziom 50%, pion 50%, przybliżenie 100%." Non-negotiable for screen-reader users.

### Zoom slider

Single shadcn `Slider` beneath the canvas, labeled "Przybliżenie" with a live value (`1.0×` → `3.0×`, step 0.1). This is the only secondary control — focalX/focalY sliders are intentionally removed; the canvas is the 2D control.

### Preview panel

Two previews on the right column, each rendered via `<PositionedImage>` so they use the exact same math as production:

1. **Hero na stronie oferty** — `aspect-[21/9]`, full column width. Matches the public & panel detail heroes. Subtle bottom-10% darkened band hints where the title sits, so owners don't park the subject behind it. Purely a framing aid, not a fidelity mock.
2. **Karta na liście ofert (mobilna)** — the worst-case crop. The mobile stacked variant of `OfferListCard` is `w-full min-h-64` — approximately **5/3**. Using the worst crop here means if the user is happy with this preview, the desktop renders look equal-or-better automatically. Capped at `max-w-[200px]` inside the column.

No map-pin / carousel / panel-list previews in V1 (confirmed in brainstorming).

### Naming (final)

- Entry button label: **"Dostosuj kadr"**
- Dialog title: **"Dostosuj kadr głównego zdjęcia"**
- Primary CTA: **"Zapisz kadr"**
- Secondary CTA: **"Wyśrodkuj"** (resets to default)
- Tertiary: **"Anuluj"**
- Zoom slider label: **"Przybliżenie"**
- Entry button icon: `CropIcon` from lucide
- Live-region aria text: `"Punkt główny: poziom {focalX}%, pion {focalY}%, przybliżenie {zoom×100}%"`

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
- **Checks ownership manually** — the collection's current `adminOrHigherOrSelfByEmail('uploadedBy')` access rule is broken (no `uploadedBy` field on `OfferUploads`; owner field is `user`). Mirror the manual pattern from `deleteOffer` in [src/actions/panel/offers.ts](../../src/actions/panel/offers.ts): fetch the upload, fetch the full user, check `upload.user === user.id` OR `user.role in {admin, moderator}`.
- Uses `payload.update({ collection: 'offer-uploads', id, data: { focalX, focalY, zoom }, overrideAccess: true })` after ownership passes.
- `revalidatePath('/panel/oferty')`, `revalidatePath('/panel/oferty/[slug]', 'page')`, and `revalidatePath('/ogloszenia/[slug]', 'page')` so panel list + panel detail + public detail all re-render with the new framing.
- Returns `{ success, data/error }` per project convention.

## Entry points

### Wizard media step

`src/components/panel/wizard/FileUpload.tsx` `SingleImageUpload` (main image): add a "Dostosuj kadr" button next to the existing pencil + trash controls on the uploaded preview. The button is an `ImagePositionEditor` child trigger:

```tsx
<ImagePositionEditor
  imageUrl={value.url}
  initialPosition={{ focalX: value.focalX, focalY: value.focalY, zoom: value.zoom }}
  onConfirm={async (position) => {
    const res = await updateOfferUploadPosition(value.id, position)
    if (res.success) {
      onChange({ ...value, focalX: position.focalX, focalY: position.focalY, zoom: position.zoom })
      return { ok: true }
    }
    return { ok: false, error: res.error }
  }}
>
  <Button variant="outline" size="sm"><CropIcon /> Dostosuj kadr</Button>
</ImagePositionEditor>
```

The local `UploadedFile` type in `OfferWizardForm` extends to include the three position fields so wizard state round-trips without a backend re-fetch. **Re-uploading via the pencil button wipes the position** (new upload, fresh defaults) — expected and consistent with "re-upload = new image, new framing."

### Panel offer detail view

`src/components/panel/oferty/OfferDetailView.tsx` hero: a small floating icon button (top-right of the 21/9 hero) visible to offer owners (admin/moderator/self). `onConfirm` calls the same server action + `router.refresh()` so the hero + info grid re-render immediately.

**Consolidation note**: OfferDetailView is touched once for both the `<PositionedImage>` swap and the edit button — single edit, not two.

## Display-surface consumers

### Simple swaps (preserve hover behavior)

Replace `<Image fill className="..." />` with `<PositionedImage position={...}>` at:

1. **`OfferCard` (panel list)** — preserve `hover:scale-105` via `imgClassName`.
2. **`OfferDetailView` hero (panel)** — no inner hover on the image; straight swap.

### Non-trivial swaps (require prop plumbing)

3. **`OfferListCard` (public)** — the component currently takes `imageUrl?: string` (a value prop), not the offer object. **Extend `OfferListCardProps` to add `position?: Partial<ImagePosition> | null`** and thread it from [ListView/OffersView/index.tsx](../../src/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/index.tsx). This is a 2-file, ~6-line change, not a 1-liner. Memoization of `OfferListCard` (if any) needs to accept an object prop — fine, a new object per render is acceptable here since the card re-mounts on search/filter anyway.

4. **Public offer hero** — the public hero runs through:
   - [src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferHero/index.tsx](../../src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferHero/index.tsx) — converts `OfferUpload → Media`-like shim and currently **drops** `focalX`/`focalY`.
   - [src/components/heros/BackgroundImage/index.tsx](../../src/components/heros/BackgroundImage/index.tsx) — the actual `<Image fill object-cover>` render.

   The swap requires: (a) extend the shim in `OfferHero/index.tsx` to preserve focalX/Y/zoom, (b) teach `BackgroundImage` to accept and apply `position` (or fork it — a new `PositionedBackground` that wraps `PositionedImage` and keeps the rest of the hero wiring). Plan task will decide the cleanest shape once the files are in hand.

### Not swapped in V1

Carousel, map pin, featured-offers tile. These keep their current raw rendering. Defaults (center, zoom=1) match today's behavior exactly.

Each consumer must fetch the upload with `depth >= 1` so `offer.mainImage` is the populated `OfferUpload` object. Verify at each call site during plan execution — don't assume.

## Edge cases

- **Missing image**: `<PositionedImage>` outer container + muted fallback, regardless of position.
- **Image 404 after load**: `onError` on the inner `next/image` swaps to the muted placeholder. Same visual as "no image."
- **Dirty stored data** (`focalX = 150`, `zoom = 5`): `resolvePosition` clamps to the legal range before DOM.
- **Extreme intrinsic aspect ratio** (1080×1920 portrait on 21/9 hero): `object-cover` already heavily crops; zoom 1–3 cannot un-crop. The editor's canvas shows the source image full-size so the user sees what they're working with; the hero preview shows the resulting crop. **Working as intended** — zoom-out below 1× is not supported.
- **Low-resolution source** (e.g. 800×600) with zoom > 2×: image visibly blurs on the hero. Non-blocking for V1; no in-app warning.
- **Unsaved changes + Cancel**: state discarded silently.
- **Save-in-progress + close attempt**: Dialog close controls (X, backdrop click, Esc) are disabled; Anuluj button is hidden while `onConfirm` resolves.
- **Concurrent edits (two tabs)**: last-write-wins. No optimistic locking.
- **Editing a published offer**: the edit goes **live immediately** on `Zapisz kadr` (via `revalidatePath` on the public route). Owner sees the change in the detail view right away; public visitors see it on their next page load. No preview-vs-published split.
- **SSR**: `PositionedImage` is server-component-safe. `ImagePositionEditor` is `'use client'` (uses `useState`, pointer events). Fine — it lives inside already-client subtrees (wizard) or is dynamically mounted as a dialog from a server component parent.
- **Prefers-reduced-motion**: Dialog open/close animation is shadcn's default (respects media query). Canvas drag/zoom are direct manipulation — no guard needed.

## Testing

Single unit test file: `positionStyles.test.ts`.

Cases:
1. `DEFAULT_POSITION` → `{ objectFit: 'cover', objectPosition: '50% 50%' }`, no `transform`.
2. Off-center focal (20 / 80 / 1) → `objectPosition: '20% 80%'`, no `transform`.
3. Zoom 2×, focal (30 / 40) → `transform: scale(2)`, `transformOrigin: '30% 40%'`.
4. `resolvePosition({})` → `DEFAULT_POSITION`.
5. `resolvePosition({ focalX: 150, focalY: -10, zoom: 5 })` → clamped `{ focalX: 100, focalY: 0, zoom: 3 }`.

No component tests. Editor canvas, slider, preview panel, server action — all covered by the pure helper plus manual QA on the wizard + detail view. Matches the rest of the panel testing strategy.

## Rollout — two PRs recommended

A single PR is defensible but large. The spec lists 15 tasks; a clean seam splits the work:

### PR 1 — Plumbing (zero UX change)

1. Migration file + `src/migrations/index.ts` registration.
2. `offer-uploads` collection config — add `zoom` field.
3. Run `pnpm generate:types` to refresh `payload-types.ts`.
4. Run `pnpm payload migrate` locally to apply before commit.
5. `types.ts` + `resolvePosition` + `DEFAULT_POSITION`.
6. `positionStyles.ts` + `positionStyles.test.ts` (TDD).
7. `PositionedImage.tsx`.
8. Consumer swaps:
   - Panel `OfferCard` (1-line, preserve `hover:scale-105` via `imgClassName`).
   - Panel `OfferDetailView` hero (1-line).
   - Public `OfferListCard` (2-file prop plumbing).
   - Public offer hero (shim fix in `OfferHero/index.tsx` + branch in `BackgroundImage` or a new `PositionedBackground`).

After PR 1 lands, every existing offer renders **identically** (defaults reproduce today's behavior). No user-visible change.

### PR 2 — Editor + entry points

1. `EditorCanvas.tsx` (drag + wheel + keyboard + focal dot + rule-of-thirds + live region).
2. `EditorZoomSlider.tsx`.
3. `EditorPreviewPanel.tsx`.
4. `ImagePositionEditor.tsx` (Dialog + state + uncontrolled trigger slot + save flow with Result).
5. `updateOfferUploadPosition` server action with manual ownership check.
6. Wizard entry point: "Dostosuj kadr" button in `SingleImageUpload`.
7. Panel detail entry point: floating edit button on `OfferDetailView` hero.
8. Manual QA.

**If time pressure requires a single PR**, that's fine — the split is for review ergonomics. Plan can collapse the two lists into one task sequence.

## Future hooks (out of scope, design keeps the door open)

- **AI crop suggest**: the `ImagePosition` type is exactly what an AI endpoint would return. A future "Zaproponuj kadr" button → `/api/suggest-crop` → `{ position }` → editor applies optimistically. Module needs no changes.
- **Gallery / background / video thumbnail positioning**: the editor is fully URL-agnostic; a future `<BackgroundImagePositionEditor>` is just another caller wiring its own entry point.
- **Per-surface position overrides**: explicitly rejected in brainstorming. Escape hatch if ever needed: pass a `position` prop directly to a specific `<PositionedImage>` overriding the upload's stored value. Module already supports this.
- **Undo stack within the editor**: "Wyśrodkuj" is a hard reset. A soft undo (`Cmd+Z`) is a 10-line `useReducer` swap if demand appears.
- **Telemetry**: the project ships no analytics today. If analytics are added later, natural emit points are `editor.opened` and `editor.confirmed`.
