# Video Aspect Ratio Selection

## Summary

Add a configurable aspect ratio select field to both the Video block and Offer video, allowing users to choose between 16:9 (landscape), 9:16 (vertical), and 1:1 (square). The frontend renders the video container with the corresponding CSS aspect ratio, with height capping and centering for vertical videos.

## Rationale

Currently both video components are hardcoded to 16:9 (`aspect-video`). Users uploading vertical (TikTok/Reels-style) or square (Instagram-style) videos get black bars or awkward framing. A simple dropdown lets them match the container to their content.

## Data Model

A `select` field with three options:

| Value  | Label (EN)         | Label (PL)          | Default |
|--------|--------------------|---------------------|---------|
| `16:9` | Landscape (16:9)   | Poziome (16:9)      | Yes     |
| `9:16` | Vertical (9:16)    | Pionowe (9:16)      | No      |
| `1:1`  | Square (1:1)       | Kwadratowe (1:1)    | No      |

**Field naming:**
- **Video block** (`src/blocks/Video/config.ts`): field named `aspectRatio`
- **Offer fields** (`src/collections/Offers/fields.ts`): field named `videoAspectRatio` (prefixed because Offers have many fields)

After adding these fields, run `payload generate:types` to regenerate `payload-types.ts`.

## Frontend Rendering

### CSS mapping

| Value  | Container classes                              |
|--------|------------------------------------------------|
| `16:9` | `aspect-video max-h-[600px]`                   |
| `9:16` | `aspect-[9/16] max-h-[600px] max-w-sm mx-auto` |
| `1:1`  | `aspect-square max-h-[600px]`                  |

The 9:16 container gets `max-w-sm mx-auto` to keep it narrow and centered on desktop — a full-width 9:16 would be impractically tall. On mobile screens narrower than 384px, `max-w-sm` has no effect and the video fills the width naturally, which is acceptable for phone-sized screens that are already narrow.

### Where aspect classes are applied

Both components currently apply `aspect-video` in two places: on the container `<div>` and on the `<video>` element. The dynamic aspect class replaces **both** occurrences. The `<video>` element keeps its existing `object-contain` class (no change needed there — it's already present).

The error state fallback in OfferVideo (`<div className="w-full aspect-video ...">`) must also use the dynamic aspect class so the error container matches the selected ratio.

The outer wrappers (`max-w-5xl` on Video block, `max-w-4xl` on OfferVideo) remain unchanged — for 9:16, the inner `max-w-sm` is narrower and takes effect.

### Shared utility

Extract to `src/lib/getVideoAspectClasses.ts` so both components share identical logic:

```ts
export function getVideoAspectClasses(ratio?: string): string {
  switch (ratio) {
    case '9:16':
      return 'aspect-[9/16] max-h-[600px] max-w-sm mx-auto'
    case '1:1':
      return 'aspect-square max-h-[600px]'
    default:
      return 'aspect-video max-h-[600px]'
  }
}
```

### Affected files

1. **`src/lib/getVideoAspectClasses.ts`** — new shared utility
2. **`src/blocks/Video/config.ts`** — add `aspectRatio` select field
3. **`src/blocks/Video/Component.tsx`** — pass `aspectRatio` to client component
4. **`src/blocks/Video/Component.client.tsx`** — accept `aspectRatio` prop, replace hardcoded `aspect-video` on both the container div and video element
5. **`src/collections/Offers/fields.ts`** — add `videoAspectRatio` select field after `video`
6. **`src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferVideo/index.tsx`** — read `offer.videoAspectRatio`, replace hardcoded `aspect-video` on container div, video element, and error state fallback

## Migration

No data migration needed. The new field defaults to `16:9`, so existing videos with no value render exactly as they do today.
