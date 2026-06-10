---
type: debt
summary: "AI generation quota in guardAiGeneration is per-warm-instance (in-memory Map); a determined authenticated user can exceed the daily cap across instances. Needs a durable store (Payload collection / KV) for an exact cross-instance limit."
tags: [ai, security, rate-limit]
status: open
created: 2026-06-10
updated: 2026-06-10
related: ["[[ai-content]]"]
sources: []
severity: low
effort: med
---

# AI generation rate limit is best-effort, not durable

`src/lib/ai/guard.ts` gates `/api/generate-content` and `/api/generate-description` with a
session check plus a per-user daily counter held in module memory. On serverless that counter
is per warm instance, so the practical cap is `DAILY_LIMIT × instances` — fine as an abuse
*bound* now that the routes require auth (the pre-2026-06-10 state was unauthenticated and
unlimited), but not an exact quota.

**Fix when it matters:** persist the counter (small Payload collection keyed by user+day, or a
KV/Redis once one exists in the stack) and enforce in `guardAiGeneration` so both routes pick
it up unchanged. Schema change ⇒ follow the eventizer-payload-migrations procedure.
