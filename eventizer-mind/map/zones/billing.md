---
type: zone
summary: "Stripe subscriptions: plan sync, customer portal, webhook-driven role transitions, plan-change wizard, downgrade drafting, event purge cron."
tags: [billing, stripe, subscriptions]
status: active
created: 2026-06-02
updated: 2026-06-02
related: []
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: []
  anchors: []
  globs:
    - "src/actions/stripe/**"
    - "src/lib/stripe/**"
    - "src/lib/subscriptions/**"
    - "src/app/api/cron/purge-stripe-events/**"
depends: ["[[auth]]", "[[offers-data]]"]
invariants:
  - rule: "Subscription lifecycle events drive client ↔ service-provider role transitions."
    enforcedBy: ["[[test:stripe-webhooks.int]]"]
  - rule: "Plan downgrade drafts offers beyond the new plan's limit/category access."
    enforcedBy: ["[[test:draftOffersOnDowngrade.int]]"]
verifiedAt: "32f283812d0ecc55e57c5b005fcaaaa2893d06ce"
---

# Billing

## Purpose
Stripe-powered subscription management for Eventizer service providers. Plans are tiered by
category access and offer limits; clients browse for free. Server actions under `src/actions/stripe/`
handle checkout session creation, plan changes (with impact computation), beta access activation,
and customer portal redirects. `src/lib/stripe/` contains low-level Stripe helpers including
idempotent event deduplication (`deduplicateStripeEvent`). `src/lib/subscriptions/` drives
business logic: `syncUserFromPlan` transitions user roles on webhook events; `draftOffersOnDowngrade`
drafts offers that exceed the new plan's limits. A cron route purges processed Stripe events to
keep the `ProcessedStripeEvents` table lean.

## Anchors
- `src/actions/stripe/` — server actions: `createCheckoutSession`, `changePlan`, `computePlanChangeImpact`,
  `checkSubscription`, `manageSubscription`, `activateBetaAccess`.
- `src/lib/stripe/deduplicateStripeEvent.ts` — idempotent webhook event deduplication.
- `src/lib/subscriptions/syncUserFromPlan.ts` — role transition logic.
- `src/lib/subscriptions/draftOffersOnDowngrade.ts` — downgrade-triggered offer drafting.
- `src/app/api/cron/purge-stripe-events/route.ts` — cron cleanup route.

## Invariants
- Webhook handlers must deduplicate via `deduplicateStripeEvent` before processing to be idempotent.
- `syncUserFromPlan` is the only place that modifies user roles from subscription state; ad-hoc role
  writes in webhook handlers are forbidden.
