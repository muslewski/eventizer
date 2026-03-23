# Video Aspect Ratio Selection

## Summary

Add a configurable aspect ratio select field to both the Video block and Offer video, allowing users to choose between 16:9 (landscape), 9:16 (vertical), and 1:1 (square). The frontend renders the video container with the corresponding CSS aspect ratio, with height capping and centering for vertical videos.

## Rationale

Currently both video components are hardcoded to 16:9 (`aspect-video`). Users uploading vertical (TikTok/Reels-style) or square (Instagram-style) videos get black bars or awkward framing. A simple dropdown lets them match the container to their content.

## Data Model

A `select` field named `aspectRatio` with three options:

| Value  | Label (EN)         | Label (PL)          | Default |
|--------|--------------------|---------------------|---------|
| `16:9` | Landscape (16:9)   | Poziome (16:9)      | Yes     |
| `9:16` | Vertical (9:16)    | Pionowe (9:16)      | No      |
| `1:1`  | Square (1:1)       | Kwadratowe (1:1)    | No      |

Added to two locations:
1. **Video block config** (`src/blocks/Video/config.ts`) — new field after `video` upload
2. **Offer fields** (`src/collections/Offers/fields.ts`) — new field named `videoAspectRatio` after `video` upload in the media tab

## Frontend Rendering

### CSS mapping

| Value  | Aspect class       | Additional classes                    |
|--------|-------------------|---------------------------------------|
| `16:9` | `aspect-video`     | `max-h-[600px]`                       |
| `9:16` | `aspect-[9/16]`    | `max-h-[600px] max-w-sm mx-auto`      |
| `1:1`  | `aspect-square`    | `max-h-[600px]`                       |

The 9:16 container gets `max-w-sm mx-auto` to keep it narrow and centered on desktop — a full-width 9:16 would be impractically tall.

All containers use `object-contain` on the `<video>` element so actual video content is never cropped.

### Affected files

1. **`src/blocks/Video/config.ts`** — add `aspectRatio` select field
2. **`src/blocks/Video/Component.tsx`** — pass `aspectRatio` to client component
3. **`src/blocks/Video/Component.client.tsx`** — accept `aspectRatio` prop, replace hardcoded `aspect-video` with dynamic class
4. **`src/collections/Offers/fields.ts`** — add `videoAspectRatio` select field after `video`
5. **`src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferVideo/index.tsx`** — read `offer.videoAspectRatio`, replace hardcoded `aspect-video` with dynamic class

### Shared utility

A small helper to map ratio value to CSS classes, used by both video components:

```ts
function getAspectClasses(ratio?: string): string {
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

This can live inline in each component (it's 6 lines) or be extracted to a shared util if preferred.

## Migration

No data migration needed. The new field defaults to `16:9`, so existing videos with no `aspectRatio` value render exactly as they do today.
