---
type: debt
summary: "Offer mainImage is served as WebP, so its og:image is WebP; older/edge social clients render WebP unreliably. A JPEG `og` size or dynamic transcode would maximize preview compatibility."
tags: [seo, og, media, offers]
status: open
created: 2026-06-03
updated: 2026-06-03
related: ["[[media]]", "[[offer-listing]]", "[[social-link-previews]]"]
sources: []
severity: low
effort: med
---

# Offer og:image is WebP

## What
`OfferUploads` stores images as WebP (`formatOptions.format = 'webp'`). When an offer page sets its
`og:image` to `mainImage`, that image is WebP. After the [[social-link-previews]] fix the URL is
valid (no more 404 / malformed origin) and modern `facebookexternalhit` renders WebP, so previews
work in the common path — but WebP support is inconsistent across older clients and some chat apps,
leaving a residual flake class.

## Risk
Low. Affects only the preview *thumbnail* for offer links on the subset of clients that don't
render WebP; the page itself and the title/description are unaffected, and imageless pages already
fall back to the PNG default.

## Fix sketch
Two viable approaches:
1. **JPEG `og` image size** — add an `og` entry (1200×630, `formatOptions.format: 'jpeg'`) to
   `OfferUploads.imageSizes`, wire `generateMeta` to prefer `meta.image.sizes?.og?.url`, and run a
   Payload schema migration (new size columns) per the `eventizer-payload-migrations` skill.
   Caveat: existing offers won't have the size until re-uploaded/reprocessed — they keep falling
   back to the PNG default, which is acceptable.
2. **Dynamic transcode route** — an `og` route handler that fetches the offer image and transcodes
   WebP→JPEG with `sharp` on the fly (works for existing offers too, no migration), at the cost of
   a per-scrape function invocation.
