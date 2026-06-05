---
type: spec
summary: "Replace the fake sign-in hero stats with honest beta numbers and turn the four placeholder 'Zaufali nam najlepsi' circles into real partner logos, driven by a new showOnSignIn checkbox on the partners collection."
tags: [auth, sign-in, partners, content-blocks]
status: draft
created: 2026-06-05
related: ["[[auth]]", "[[content-blocks]]"]
---

# Sign-in: real stats + partner logos

## Problem

Both sign-in screens (service-provider and client) show fabricated stats (e.g. `200K+`
registered users, `5K+` monthly events) and a "Zaufali nam najlepsi" row of four empty
placeholder circles. We want honest numbers that match the beta reality, and we want the
trust row to display logos of actual partners we already store in the `partners` collection.

## Goals

1. Replace the four hero stats with realistic beta numbers.
2. Let an admin curate which partners appear in the sign-in "Zaufali nam najlepsi" row via a
   new checkbox, reusing the existing `partners` collection and its `logo` upload.
3. Show up to four real partner logos; show nothing fake when none qualify.

## Non-goals

- Sourcing/uploading partner logos from external websites. Out of scope — admins upload logos
  via Payload admin. A flagged partner with no logo simply stays hidden (this is the intended
  "missing logo = go grab it from their site" signal).
- Per-screen partner curation. Both screens share one component and show the same curated set.
- Computing stats live from the database. Numbers are hardcoded strings for now.

## Design

### 1. Honest stats (props only, no logic)

Edit the `informationTitle*` props in the two layouts:

| File | Stat label | Now → New |
| --- | --- | --- |
| `src/app/(frontend)/[lang]/auth/(service-provider)/layout.tsx` | Zarejestrowanych użytkowników | `200K+` → `500+` |
| `src/app/(frontend)/[lang]/auth/(service-provider)/layout.tsx` | Wydarzeń miesięcznie | `5K+` → `50` |
| `src/app/(frontend)/[lang]/auth/(client)/layout.tsx` | Aktywnych usług | `70K+` → `100+` |
| `src/app/(frontend)/[lang]/auth/(client)/layout.tsx` | Branż eventowych | `120+` → `10` |

Use the literal strings `500+`, `50`, `100+`, `10` (no plus on `50` and `10`).

### 2. New `showOnSignIn` checkbox on `partners`

Add to `src/collections/Partners.ts` fields:

```ts
{
  name: 'showOnSignIn',
  type: 'checkbox',
  defaultValue: false,
  label: { en: 'Show on sign-in screen', pl: 'Pokaż na ekranie logowania' },
  admin: {
    description: {
      en: 'Show this partner in the "Zaufali nam najlepsi" row on the sign-in screens. Only partners with a logo appear; max 4, ordered by the list drag-order above.',
      pl: 'Pokaż tego partnera w sekcji "Zaufali nam najlepsi" na ekranach logowania. Wyświetlani są tylko partnerzy z logo; maks. 4, w kolejności ustawionej powyżej.',
    },
  },
}
```

This adds a DB column → follow the `eventizer-payload-migrations` flow: generate and commit a
migration so the Vercel production build does not fail with a missing-column error.

The collection already has `orderable: true`, so the admin's manual drag-order (`_order`)
determines which four appear.

### 3. `TrustedPartners` async server component

Create `src/heros/MediumImpact/Content/TrustedPartners.tsx` (async server component). It owns the
heading + the logo row (moved out of `Content/index.tsx`):

- Query: `payload.find({ collection: 'partners', where: { showOnSignIn: { equals: true }, logo: { exists: true } }, sort: '_order', limit: 4, depth: 1 })`.
- Resolve each logo URL with the existing `isExpandedDoc<Media>` pattern (mirror
  `src/blocks/Partners/Component.client.tsx`); drop any whose URL fails to resolve.
- **Empty state:** if zero partners resolve, return `null` — heading included. Never render a
  lonely heading or a fake placeholder circle.
- Otherwise render the `BlurText` "Zaufali nam najlepsi" heading (unchanged) followed by up to
  four overlapping `rounded-full` circles, preserving the current sizing/overlap classes
  (`size-16 md:size-24`, `-ml-4 md:-ml-6` on circles after the first). Each circle holds the
  partner logo via `next/image` (`object-contain` with padding), shown in full brand color (not
  grayscale), on a light circle background. Follow `eventizer-design-tokens` for exact tokens.

In `src/heros/MediumImpact/Content/index.tsx`, replace the current heading + four-circle block
(lines ~49–68) with `<TrustedPartners />`. `Content` stays a sync server component rendering the
async child — no prop threading; the component does its own fetch. Both sign-in layouts get the
same curated set automatically.

### 4. Mind maintenance (same change)

- Update the touched zone cards (`auth`, and the partners/`content-blocks` zone) and re-stamp
  their `verifiedAt` to the new HEAD.
- Add a `map/decisions/` record explaining why `showOnSignIn` lives on the `partners` collection
  (curate-once, reuse the existing logo upload, keep sign-in trust row honest).
- Run `pnpm mind:check` and commit the regenerated `map/index.md`.

## Testing / verification

- `pnpm lint` passes.
- Payload types regenerate to include `showOnSignIn`.
- Manual: tick `showOnSignIn` on 1–4 partners that have logos → their logos appear on both
  sign-in screens in drag-order; untick all → the whole "Zaufali nam najlepsi" section
  disappears; flag a partner with no logo → it does not appear.
- Production build runs the new migration without a missing-column error.

## Risks

- Forgetting the migration breaks the Vercel build on any SSG page touching partners — the
  primary reason migration generation is in-scope.
- Logo contrast on the dark hero: some brand logos may render poorly on a light circle. The
  light-circle + `object-contain` padding default mitigates this; revisit per-logo if needed.
