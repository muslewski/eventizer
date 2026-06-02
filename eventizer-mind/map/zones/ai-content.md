---
type: zone
summary: "AI-assisted authoring: the generate-content and generate-description API routes that feed the offer wizard (AI SDK + @ai-sdk/openai)."
tags: [ai, content, api]
status: active
created: 2026-06-02
updated: 2026-06-02
related: []
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: []
  anchors: []
  globs:
    - "src/app/api/generate-content/**"
    - "src/app/api/generate-description/**"
depends: ["[[offer-wizard]]"]
invariants: []
verifiedAt: "32f283812d0ecc55e57c5b005fcaaaa2893d06ce"
---

# AI Content

## Purpose
AI-assisted offer authoring routes that power the wizard's content generation features. The
`/api/generate-content` route generates Lexical-compatible rich-text body content for offers
using the Vercel AI SDK (`ai` package) with `@ai-sdk/openai`. The `/api/generate-description`
route generates a short offer `shortDescription`. Both routes are called from `AIContentDialog`
inside the offer wizard's Treść oferty step. These are POST routes that accept offer context
(title, category, existing content) and stream or return generated text.

## Anchors
- `src/app/api/generate-content/route.ts` — content generation route.
- `src/app/api/generate-description/route.ts` — short description generation route.

## Invariants
- Generated content must be compatible with the Lexical `SerializedEditorState` schema expected
  by `OfferWizardForm`; malformed nodes cause silent editor failures.
