---
type: zone
summary: "AI-assisted authoring: the generate-content and generate-description API routes that feed the offer wizard (AI SDK + @ai-sdk/openai)."
tags: [ai, content, api]
status: active
created: 2026-06-02
updated: 2026-06-10
related: ["[[ai-rate-limit-not-durable]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: []
  anchors: []
  globs:
    - "src/app/api/generate-content/**"
    - "src/app/api/generate-description/**"
depends: ["[[offer-wizard]]"]
invariants:
  - rule: "Both generate routes require a Better Auth session, zod-validate/cap their input, and apply the per-user daily limit from guardAiGeneration — they spend OpenAI money."
    enforcedBy: ["test:generateRoutes"]
verifiedAt: "65085a725ed5d2977d7d9fa4877622e35fea2924"
---

# AI Content

## Purpose
AI-assisted offer authoring routes that power the wizard's content generation features. The
`/api/generate-content` route generates Lexical-compatible rich-text body content for offers
using the Vercel AI SDK (`ai` package) with `@ai-sdk/openai`. The `/api/generate-description`
route generates a short offer `shortDescription`. Both routes are called from `AIContentDialog`
inside the offer wizard's Treść oferty step. These are POST routes that accept offer context
(title, category, existing content) and stream or return generated text.

Both routes are gated by `guardAiGeneration` (`src/lib/ai/guard.ts`): Better Auth session
required (401), zod schemas cap every input field (400), and a best-effort per-instance daily
limit returns 429 — see [[ai-rate-limit-not-durable]] for the durable-limit follow-up.

## Anchors
- `src/app/api/generate-content/route.ts` — content generation route.
- `src/app/api/generate-description/route.ts` — short description generation route.
- `src/lib/ai/guard.ts` — `guardAiGeneration` session + quota gate shared by both routes.

## Invariants
- Generated content must be compatible with the Lexical `SerializedEditorState` schema expected
  by `OfferWizardForm`; malformed nodes cause silent editor failures.
