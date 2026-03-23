# Video Aspect Ratio Selection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable aspect ratio (16:9, 9:16, 1:1) to the Video block and Offer video so vertical and square videos render correctly.

**Architecture:** A select field is added to both the Video block config and Offer fields. A shared utility maps the value to Tailwind CSS classes. Both frontend video components consume the utility to replace their hardcoded `aspect-video`.

**Tech Stack:** Payload CMS (collection/block config), Next.js (React components), Tailwind CSS (aspect ratio classes)

**Spec:** `docs/superpowers/specs/2026-03-23-video-aspect-ratio-design.md`

---

### File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/getVideoAspectClasses.ts` | Shared utility: maps ratio string → Tailwind classes |
| Modify | `src/blocks/Video/config.ts` | Add `aspectRatio` select field to Video block |
| Modify | `src/blocks/Video/Component.tsx` | Pass `aspectRatio` to client component |
| Modify | `src/blocks/Video/Component.client.tsx` | Accept `aspectRatio` prop, use dynamic classes |
| Modify | `src/collections/Offers/fields.ts` | Add `videoAspectRatio` select field after `video` |
| Modify | `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferVideo/index.tsx` | Read `offer.videoAspectRatio`, use dynamic classes |

---

### Task 1: Create shared utility

**Files:**
- Create: `src/lib/getVideoAspectClasses.ts`

- [ ] **Step 1: Create the utility file**

```ts
// src/lib/getVideoAspectClasses.ts

/**
 * Maps a video aspect ratio value to Tailwind CSS classes
 * for the video container.
 */
export function getVideoAspectClasses(ratio?: string | null): string {
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

- [ ] **Step 2: Commit**

```bash
git add src/lib/getVideoAspectClasses.ts
git commit -m "feat: add getVideoAspectClasses utility"
```

---

### Task 2: Add `aspectRatio` field to Video block config

**Files:**
- Modify: `src/blocks/Video/config.ts`

- [ ] **Step 1: Add the select field after the `video` upload field**

Add this field at the end of the `fields` array (after the `video` upload field):

```ts
{
  name: 'aspectRatio',
  type: 'select',
  defaultValue: '16:9',
  label: {
    en: 'Aspect Ratio',
    pl: 'Proporcje wideo',
  },
  options: [
    { label: { en: 'Landscape (16:9)', pl: 'Poziome (16:9)' }, value: '16:9' },
    { label: { en: 'Vertical (9:16)', pl: 'Pionowe (9:16)' }, value: '9:16' },
    { label: { en: 'Square (1:1)', pl: 'Kwadratowe (1:1)' }, value: '1:1' },
  ],
  admin: {
    description: {
      en: 'Choose the aspect ratio that matches your video.',
      pl: 'Wybierz proporcje odpowiadające Twojemu wideo.',
    },
  },
},
```

- [ ] **Step 2: Commit**

```bash
git add src/blocks/Video/config.ts
git commit -m "feat: add aspectRatio select field to Video block config"
```

---

### Task 3: Wire `aspectRatio` through Video block components

**Files:**
- Modify: `src/blocks/Video/Component.tsx`
- Modify: `src/blocks/Video/Component.client.tsx`

- [ ] **Step 1: Update `Component.tsx` to pass `aspectRatio`**

In the server component, destructure `aspectRatio` from props and pass it to `VideoClient`:

```tsx
// Destructure aspectRatio alongside existing props
> = ({ heading, description, video, aspectRatio, className }) => {

// Pass to client component
<VideoClient
  heading={heading}
  description={description}
  videoUrl={videoData.url}
  videoTitle={videoData.alt || heading}
  mimeType={videoData.mimeType ?? 'video/mp4'}
  aspectRatio={aspectRatio ?? undefined}
  className={className}
/>
```

- [ ] **Step 2: Update `Component.client.tsx` to use dynamic aspect classes**

1. Add import: `import { getVideoAspectClasses } from '@/lib/getVideoAspectClasses'`
2. Add `aspectRatio` to the `VideoClientProps` interface: `aspectRatio?: string`
3. Destructure `aspectRatio` in the component function params
4. Compute classes: `const aspectClasses = getVideoAspectClasses(aspectRatio)`
5. Replace the container div (currently `<div className="relative w-full aspect-video bg-black">`):
   - Change to: `<div className={cn('relative w-full bg-black', aspectClasses)}>`
   - Import `cn` from `@/lib/utils` (already imported)
6. On the `<video>` element, replace `className="w-full max-h-[600px] object-contain aspect-video"`:
   - Change to: `className={cn('w-full object-contain', aspectClasses)}`

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/blocks/Video/Component.tsx src/blocks/Video/Component.client.tsx
git commit -m "feat: wire aspectRatio through Video block components"
```

---

### Task 4: Add `videoAspectRatio` field to Offer fields

**Files:**
- Modify: `src/collections/Offers/fields.ts`

- [ ] **Step 1: Add the select field after the `video` upload field (after line ~323)**

Insert between the `video` upload field and the `videoPreview` UI field:

```ts
{
  name: 'videoAspectRatio',
  type: 'select',
  defaultValue: '16:9',
  label: {
    en: 'Video Aspect Ratio',
    pl: 'Proporcje wideo',
  },
  options: [
    { label: { en: 'Landscape (16:9)', pl: 'Poziome (16:9)' }, value: '16:9' },
    { label: { en: 'Vertical (9:16)', pl: 'Pionowe (9:16)' }, value: '9:16' },
    { label: { en: 'Square (1:1)', pl: 'Kwadratowe (1:1)' }, value: '1:1' },
  ],
  admin: {
    description: {
      en: 'Choose the aspect ratio that matches your video.',
      pl: 'Wybierz proporcje odpowiadające Twojemu wideo.',
    },
    condition: (data) => Boolean(data?.video),
  },
},
```

Note: The `admin.condition` makes this field only visible when a video has been uploaded.

- [ ] **Step 2: Commit**

```bash
git add src/collections/Offers/fields.ts
git commit -m "feat: add videoAspectRatio select field to Offer fields"
```

---

### Task 5: Update OfferVideo component to use dynamic aspect classes

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferVideo/index.tsx`

- [ ] **Step 1: Add import and compute classes**

1. Add import: `import { getVideoAspectClasses } from '@/lib/getVideoAspectClasses'`
2. Inside the component, after the `videoData` memo, compute:
   ```ts
   const aspectClasses = getVideoAspectClasses(offer.videoAspectRatio)
   ```

- [ ] **Step 2: Replace hardcoded `aspect-video` in three places**

1. **Error state container** (line ~81): Replace `aspect-video` with dynamic class:
   ```tsx
   <div className={cn('w-full flex items-center justify-center bg-muted rounded-lg', aspectClasses)}>
   ```
   Add `import { cn } from '@/lib/utils'` if not already imported.

2. **Video container div** (line ~94): Replace `<div className="relative w-full aspect-video bg-black">`:
   ```tsx
   <div className={cn('relative w-full bg-black', aspectClasses)}>
   ```

3. **Video element** (line ~97): Replace `className="w-full max-h-[600px] object-contain aspect-video"`:
   ```tsx
   className={cn('w-full object-contain', aspectClasses)}
   ```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferVideo/index.tsx
git commit -m "feat: use dynamic aspect ratio in OfferVideo component"
```

---

### Task 6: Regenerate Payload types and final verification

- [ ] **Step 1: Regenerate Payload types**

```bash
npx payload generate:types
```

This updates `src/payload-types.ts` with the new `aspectRatio` field on `VideoBlock` and `videoAspectRatio` on `Offer`.

- [ ] **Step 2: Run final type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit generated types**

```bash
git add src/payload-types.ts src/payload-generated-schema.ts
git commit -m "chore: regenerate Payload types for video aspect ratio fields"
```
