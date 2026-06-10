---
type: zone
summary: "Media handling: Payload upload collections on Vercel Blob, offer video processing/streaming, and the image-position (focal point) editor."
tags: [media, uploads, video]
status: active
created: 2026-06-02
updated: 2026-06-10
related: []
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: []
  anchors: []
  globs:
    - "src/collections/uploads/**"
    - "src/app/api/offer-video/**"
    - "src/components/video/**"
    - "src/components/image-position/**"
depends: []
invariants:
  - rule: "Image position-style computation stays identical across server render and client editor."
    enforcedBy: ["[[test:position-styles.int]]"]
  - rule: "Upload collections (OfferUploads, OfferVideoUploads, ProfilePictures) require an authenticated session to create — anonymous Blob writes are rejected."
    enforcedBy: ["test:uploadCreateAccess"]
verifiedAt: "65085a725ed5d2977d7d9fa4877622e35fea2924"
---

# Media

## Purpose
All media upload and delivery for Eventizer. Four Payload upload collections store files on
Vercel Blob with prefix organization: `Media` (general CMS images), `OfferUploads` (offer
images), `OfferVideoUploads` (raw offer videos), `ProfilePictures` (user avatars). A hook in
`src/collections/uploads/hooks/compressVideo.ts` processes uploaded videos. The
`src/app/api/offer-video/[filename]/route.ts` route streams processed videos. The
`src/components/image-position/` editor allows service providers to set a focal point on their
offer background image — `positionStyles.ts` computes the CSS `object-position` value used
identically by both the client-side `ImagePositionEditor` and server-rendered `PositionedImage`.

## Anchors
- `src/collections/uploads/` — upload collection definitions (Media, OfferUploads, OfferVideoUploads, ProfilePictures).
- `src/app/api/offer-video/[filename]/route.ts` — video streaming API route.
- `src/components/video/` — video player components.
- `src/components/image-position/` — focal-point editor and `positionStyles.ts`.

## Invariants
- `positionStyles.ts` must be the single source of CSS `object-position` computation — duplicating
  the formula in the server render diverges focal points between editor preview and published view.
