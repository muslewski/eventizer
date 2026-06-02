# Multi & Agency Subscription Plans — Billing & Wizard Redesign

**Date:** 2026-04-30
**Status:** Approved design (revised after specialist agent review), awaiting implementation plan
**Scope:** Add two new subscription tiers ("Multi" and "Agency") that allow multiple offers per service-provider, refactor the `/panel/plan-subskrypcji` wizard to support a "single vs multi" branching flow, and wire up downgrade-overflow handling so the published-offer count never exceeds the subscriber's plan limit.

## Goals

- Introduce two new Stripe products — **Multi** (up to 4 offers) and **Agency** (up to 10 offers) — alongside renaming the existing three Solo / Business / Enterprise products to **Single / Single+ / Single++**.
- Update the subscription wizard so service-providers first decide whether one offer is enough or they need multiple, then proceed through a path appropriate to that mode.
- Enforce **total offers ≤ plan's `maxOffers`** at all times (drafts count toward the cap to prevent storage abuse), and **published offers ≤ plan's `maxOffers`** on transitions to published.
- On a downgrade where the published count already exceeds the new cap, auto-draft the newest excess offers and surface a one-time dashboard banner so the user understands what happened.
- Keep Stripe billing portal as the single source of truth for plan switches; no in-app upgrade UI in v1.

## Non-goals (explicitly out of scope)

- In-app "Zmień plan" upgrade UI.
- Custom proration logic for upgrades/downgrades (Stripe portal defaults are fine).
- Multi/Agency public profile redesign.
- Email notifications about auto-drafted offers (dashboard banner only in v1; email is a follow-up).
- Migrating existing Single-tier users to Multi/Agency.
- Wizard state persistence across page refresh — current behavior (state wiped on refresh) is acceptable.
- Sorting drafted excess by `publishedAt` instead of `createdAt` — keep `createdAt DESC` for v1; revisit if usage data suggests otherwise.

## Plan structure

| Plan      | Stripe product       | `maxOffers` | Profile category? | How user reaches it                            |
|-----------|----------------------|-------------|-------------------|------------------------------------------------|
| Single    | renamed from Solo    | 1           | required          | Single mode → category drives plan via `requiredPlan` |
| Single+   | renamed from Business | 1          | required          | Single mode → category drives plan via `requiredPlan` |
| Single++  | renamed from Enterprise | 1        | required          | Single mode → category drives plan via `requiredPlan` |
| Multi     | new                  | 4           | none              | Multi mode → user picks plan explicitly        |
| Agency    | new                  | 10          | none              | Multi mode → user picks plan explicitly        |

Determining whether a user is on a "Multi-class" plan: read `plan.maxOffers > 1`. No new `kind`/`type` field is needed.

## Semantics of `maxOffers`

- The **total** number of offers a user owns (drafts + published) must be ≤ `user.maxOffers`. This is the existing `enforceMaxOffers` create-cap and stays in force.
- Independently, the **published** count must also be ≤ `user.maxOffers`. Enforced by a new `enforceMaxPublishedOffers` hook on transitions to `_status='published'`.
- After a downgrade where the user already has more published than the new cap allows, the webhook auto-drafts the newest excess offers. The user's *total* count temporarily exceeds the new cap (because we don't delete the drafted offers), but the *published* count immediately matches the new cap. To create new offers, the user must first delete drafts to bring the total back under `maxOffers`.
- Editing existing drafts works fine. Re-publishing a drafted offer is soft-blocked by `enforceMaxPublishedOffers` until the user drafts another.

## Data model changes

### `subscription-plans.maxOffers` — new optional number field

Add to [SubscriptionPlans.ts](../../src/collections/SubscriptionPlans.ts):

```ts
{
  name: 'maxOffers',
  type: 'number',
  required: false,        // start optional, flip to required in a follow-up after admin fills all plans
  min: 1,
  defaultValue: 1,
  label: { en: 'Max Offers', pl: 'Limit Ofert' },
  admin: {
    position: 'sidebar',
    description: {
      en: 'How many offers a subscriber to this plan can own (drafts + published). Falls back to 1 if not set.',
      pl: 'Ile ofert może mieć subskrybent tego planu (wersje robocze + opublikowane). Domyślnie 1, jeśli nie ustawione.',
    },
  },
}
```

- Optional → existing rows stay `NULL`. Code reads it as `plan.maxOffers ?? 1` everywhere.
- Once admin has filled all 5 plans, a follow-up PR flips `required: true`.

### Manual Drizzle migration (required for prod)

Per the [eventizer-payload-migrations skill](../../.claude/skills/eventizer-payload-migrations/SKILL.md), Payload's auto-push works in dev only. Prod's `payload migrate && next build` requires a hand-written migration file. Without it, the Vercel build fails on the `/pl` prerender step the moment any code reads `plan.maxOffers`.

Create a single migration file `src/migrations/YYYYMMDD_HHMMSS_add_billing_tier_fields.ts` that covers both the `subscription_plans.max_offers` and `users.downgraded_drafted_at` columns (the latter is needed for the dashboard banner — see "Banner" section below):

```ts
// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "max_offers" numeric;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "downgraded_drafted_at" timestamp(3);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "max_offers";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "downgraded_drafted_at";
  `)
}
```

Register in `src/migrations/index.ts`. Neither `subscription-plans` nor `users` (auth-collection) are versioned in this codebase, so single ALTERs on the live tables are enough — no `_v` table updates needed.

### Unchanged

- `users.maxOffers` — already exists with default 1. Webhooks will start writing to it.
- `users.serviceCategory` / `users.serviceCategorySlug` — stay as text paths; for Multi/Agency they remain `null`.
- `service-categories.requiredPlan` — unchanged. Drives Single tiering as today.
- `Offers` schema — unchanged. New publish-cap hook is added, no fields move.

## Wizard UI flow

Implemented in [SubscriptionManager.tsx](../../src/components/panel/plan-subskrypcji/SubscriptionManager.tsx).

### State

```ts
type ManagerView =
  | 'status'
  | 'onboarding-mode'      // NEW — step 1
  | 'onboarding-plan'      // NEW — step 2 (Multi only)
  | 'onboarding-category'  // existing — step 2 (Single only)
  | 'onboarding-price'     // existing — step 3 (both)
```

Plus `mode: 'single' | 'multi'` and `selectedPlan: SubscriptionPlan | null` (Multi path only).

Initial view for new users: `onboarding-mode` (was `onboarding-category`). State is wiped on page refresh — acceptable for v1.

### Step counter

```ts
const stepNumber =
  view === 'onboarding-mode'      ? 1 :
  view === 'onboarding-category'  ? 2 :   // Single path
  view === 'onboarding-plan'      ? 2 :   // Multi path
  view === 'onboarding-price'     ? 3 :
  1
const totalSteps = 3 // both paths
const progressValue = (stepNumber / totalSteps) * 100   // 33, 66, 100
```

The hardcoded `value={stepNumber === 1 ? 50 : 100}` and `Krok {stepNumber} z 2` text in the existing component need to flip to the formula above.

### Step 1 — Mode picker (new for everyone)

Two cards rendered with shadcn `<Card>` (matching the visual language of `PlanCard.tsx`), in a `grid grid-cols-1 sm:grid-cols-2 gap-4` layout for mobile-friendliness. Each card uses `font-bebas tracking-wide` for the title, Montserrat for body copy, and a lucide-react icon (suggestion: `UserIcon` for Single, `LayersIcon` or `Building2Icon` for Multi).

Copy:

- **Jedno ogłoszenie wystarczy** — "Świadczę jedną główną usługę (np. tylko jako DJ albo tylko catering). Idealne, jeśli skupiasz się na jednej specjalizacji."
- **Więcej ofert** — "Świadczę kilka różnych usług (np. DJ + catering, fotograf + dekoracje). Najczęściej wybierane przez agencje i firmy oferujące wiele specjalizacji jednocześnie."

Single → goes to `onboarding-category`. Multi → goes to `onboarding-plan`.

### Step 2 — Plan picker (Multi path only)

A new component `PlanPickerCard` (new file, do **not** try to reuse `PlanCard.tsx` — that one is feature-list-driven and would require boolean prop forks). Same `grid grid-cols-1 sm:grid-cols-2 gap-4` layout. Each card shows:

- Plan name (Bebas, large) and offer-limit badge ("Do 4 ofert" / "Do 10 ofert").
- Description from `plan.description` (admin-editable).
- A **subtle pricing strip** below the body — two lines, `text-sm text-muted-foreground`:
  - `99 zł / miesiąc`
  - `999 zł / rok`
- A "Wybierz" button that sets `selectedPlan` and navigates to `onboarding-price`.

**Pricing-strip values are fetched server-side** in [page.tsx](../../src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx) so step 2 doesn't have a client-side fetch flicker. Filter the prices explicitly:

```ts
const monthly = prices.find(p => p.recurring?.interval === 'month' && p.recurring.intervalCount === 1)
const yearly  = prices.find(p => p.recurring?.interval === 'year'  && p.recurring.intervalCount === 1)
```

Sorting by `unitAmount` alone would pick the 6-month price as "cheapest monthly". The filter above is required.

**Caching:** wrap the per-plan price fetch in Next.js `unstable_cache` with a 1-hour TTL and a tag like `stripe-plan-prices:<productId>`. Stripe price changes are infrequent. Avoids two extra Stripe API calls per page render.

**Stripe-down fallback:** if `getStripePrices` fails or returns empty, render `Cena niedostępna` in place of the pricing strip and log a warning. Don't block the wizard.

### Step 2 — Category picker (Single path only)

Unchanged. `CategoryPicker` shows the full hierarchy; plan is derived via `getRequiredPlanFromCategory`.

For Multi path, this step is **skipped entirely**. Multi/Agency users have no profile category — they pick categories per offer in the offer wizard.

### Step 3 — Interval picker (both paths)

Identical to today's `onboarding-price` view. The differences:

- The `stripeProductId` passed to `getStripePrices` comes from `selectedPlan.stripeID` for Multi, `getRequiredPlanFromCategory(...).stripeID` for Single.
- The Beta option (currently shown when `BETA_MODE=true`) stays available on **all** paths — Single, Multi, Agency. When the user picks Beta, the wizard calls `activateBetaAccess` and skips Stripe entirely.

### Status view tweaks

In the status view of [SubscriptionManager.tsx](../../src/components/panel/plan-subskrypcji/SubscriptionManager.tsx):

- **"Zmień kategorię" button** — hide when `subscription.currentPlan?.maxOffers > 1`. Single users keep existing behavior. Beta users (where `currentPlan` is undefined) keep the button visible (matches today's behavior — beta users have a `serviceCategory` set).
- **`<CardDescription>` empty-render fix** — currently `<CardDescription>` always renders, with `user.serviceCategory && (…)` inside. For Multi/Agency users this leaves a small empty spacer. Move the conditional one level up: render `<CardDescription>` only when `user.serviceCategory` is truthy.
- **No "Zmień plan" button.** Plan changes flow through "Zarządzaj płatnościami" → Stripe billing portal.

## Checkout payload changes

In [createCheckoutSession.ts](../../src/actions/stripe/createCheckoutSession.ts), no signature changes are required.

For Multi/Agency, the wizard passes `categoryNames: []` and `categorySlugs: []`. The webhook handlers must be updated to treat empty arrays as "no category data" rather than "join into an empty string". Today's check is `Array.isArray(x)`; tighten it to `Array.isArray(x) && x.length > 0`. Otherwise empty arrays serialize through `[].join(' > ') === ''` and write `serviceCategory: ''` rather than leaving it `null`.

## Webhook handler changes

In [plugins/index.ts](../../src/plugins/index.ts).

### `checkout.session.completed` (modify existing)

Currently sets `role` and optionally `serviceCategory` / `serviceCategorySlug`. **Add:** retrieve the subscription via `stripe.subscriptions.retrieve(session.subscription)`, look up `subscription-plans` by the product ID, and write `plan.maxOffers ?? 1` onto `user.maxOffers` in the same `payload.update` call. **Tighten:** the category-conditional must check `Array.isArray(arr) && arr.length > 0` to avoid writing `''`.

### `customer.subscription.created` (modify existing)

Same `maxOffers` addition. This is the redundant fallback that handles the case when `checkout.session.completed` is missed. Reads the product ID directly from `event.data.object.items.data[0].price.product`.

### `customer.subscription.updated` (NEW handler)

The plan-change / upgrade / downgrade engine. Idempotent and resilient:

```ts
'customer.subscription.updated': async ({ event, payload }) => {
  try {
    const sub = event.data.object
    if (sub.status !== 'active' && sub.status !== 'trialing') return

    // Resolve user
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
    if (!customerId) return
    const customers = await payload.find({
      collection: 'stripe-customers',
      where: { stripeID: { equals: customerId } },
      limit: 1,
    })
    const linkedUser = customers.docs[0]?.user
    const userId = typeof linkedUser === 'object' ? linkedUser?.id : linkedUser
    if (!userId) return

    // Resolve product → plan → newMax
    const productId = typeof sub.items.data[0].price.product === 'string'
      ? sub.items.data[0].price.product
      : sub.items.data[0].price.product.id
    const plans = await payload.find({
      collection: 'subscription-plans',
      where: { stripeID: { equals: productId } },
      limit: 1,
    })
    const newMax = plans.docs[0]?.maxOffers ?? 1

    // Skip everything if value hasn't changed (avoids per-event published-offer query)
    const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 })
    if (user.maxOffers === newMax) return

    // Update user.maxOffers
    await payload.update({
      collection: 'users',
      id: userId,
      data: { maxOffers: newMax },
    })

    // Drift correction: if currently published > newMax, draft the newest excess
    const published = await payload.find({
      collection: 'offers',
      where: {
        user: { equals: userId },
        _status: { equals: 'published' },
      },
      sort: ['-createdAt', '-id'],   // -id is the deterministic tiebreaker
      limit: 0,
      depth: 0,
    })
    if (published.docs.length > newMax) {
      const excess = published.docs.slice(0, published.docs.length - newMax)
      const results = await Promise.allSettled(
        excess.map((offer) =>
          payload.update({
            collection: 'offers',
            id: offer.id,
            data: { _status: 'draft' },
          }),
        ),
      )
      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        payload.logger.error(
          `customer.subscription.updated: Failed to draft ${failed.length}/${excess.length} offers for user ${userId}`,
          failed,
        )
      }
      payload.logger.info(
        `customer.subscription.updated: Drafted ${excess.length - failed.length}/${excess.length} offers for user ${userId} (newMax=${newMax})`,
      )

      // Set the banner flag so the dashboard surfaces a one-time notification
      await payload.update({
        collection: 'users',
        id: userId,
        data: { downgradedDraftedAt: new Date().toISOString() },
      })
    }
  } catch (err) {
    // Swallow — Stripe should not retry forever on our internal errors.
    // Logged for observability; next webhook event (if any) re-runs the same drift check.
    payload.logger.error('customer.subscription.updated handler failed', err)
  }
}
```

Key resilience points:
- Wrapped in try/catch so a thrown error doesn't bubble up to Stripe (which would retry for 3 days).
- `Promise.allSettled` so partial failures don't poison the batch.
- Short-circuits before the published-offers query if `maxOffers` is unchanged (the common case for non-product `subscription.updated` events).
- Deterministic sort tiebreaker `-id` so retries of the same drift check are stable.

### `customer.subscription.deleted` (no change)

Already drafts all offers and reverts to client. Good as-is.

## Publish-cap enforcement

New hook `enforceMaxPublishedOffers` at `src/collections/Offers/hooks/enforceMaxPublishedOffers.ts`. Wired in the Offers collection alongside the existing `enforceMaxOffers`.

```ts
import { isClientRoleEqualOrHigher } from '@/access/utilities'
import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'

export const enforceMaxPublishedOffers: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  // Only enforce on transitions to published
  const willBePublished = data._status === 'published'
  const wasPublished = originalDoc?._status === 'published'
  if (!willBePublished || wasPublished) return data

  // Bypass for moderators+ who are operating with a session
  if (req.user && isClientRoleEqualOrHigher('moderator', req.user)) return data

  // Resolve owner — works for both create (data.user) and update (originalDoc.user)
  const rawOwner = originalDoc?.user ?? data.user
  if (!rawOwner) return data    // No owner means we can't enforce; let it through
  const ownerId = typeof rawOwner === 'object' ? rawOwner.id : rawOwner

  // Read the OWNER's maxOffers, NOT req.user's (req.user may be undefined when called
  // from server actions or webhooks; or could be a moderator with their own limits).
  const owner = await req.payload.findByID({
    collection: 'users',
    id: ownerId,
    depth: 0,
  })
  const userMax = owner?.maxOffers ?? 1

  const currentlyPublished = await req.payload.find({
    collection: 'offers',
    where: {
      user: { equals: ownerId },
      _status: { equals: 'published' },
      ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
    },
    limit: 0,
    depth: 0,
  })

  if (currentlyPublished.totalDocs >= userMax) {
    throw new ValidationError({
      errors: [
        {
          path: '_status',
          message: `Osiągnięto limit opublikowanych ofert (${userMax}). Aby opublikować tę ofertę, najpierw przenieś inną do wersji roboczej.`,
        },
      ],
    })
  }
  return data
}
```

Key design decisions:
- The bypass condition `req.user && moderator` (note: AND) ensures that when `req.user` is undefined (e.g. webhook context), the hook does NOT bypass — except via the explicit `if (!rawOwner) return data` short-circuit that's only hit when there's no owner to look up.
- `userMax` is read from the owner's user record, not `req.user`. This handles the case of a moderator publishing on someone's behalf, and the case where `req.user` is undefined (server actions called without `req`).

### Wizard publish UX — pre-check pattern

Rather than catch-and-retry-as-draft, use a **pre-check** in [offers.ts](../../src/actions/panel/offers.ts):

- Before the publish `payload.update` call, count the user's currently published offers.
- If `count >= user.maxOffers`, save as draft instead of published, return:

  ```ts
  return {
    success: true,
    data: { id: offerId },
    savedAsDraftDueToLimit: true,
    message: 'Limit ofert opublikowanych osiągnięty — oferta została zapisana jako wersja robocza.',
  }
  ```

- Otherwise proceed with the publish.

This is cleaner than catching `ValidationError` after the fact — no `instanceof` gymnastics, no double-update, and the return shape conforms to the existing `{ success, data, ...metadata }` discriminated union per the [eventizer-server-actions skill](../../.claude/skills/eventizer-server-actions/SKILL.md). The hook itself is still the source of truth — the pre-check is a UX optimization that produces a friendlier error path.

The client side checks `result.savedAsDraftDueToLimit === true` and shows a toast with `result.message`.

## Beta access path

`activateBetaAccess` ([activateBetaAccess.ts](../../src/actions/stripe/activateBetaAccess.ts)) is the no-Stripe shortcut for the free beta. It's currently called only when `BETA_MODE=true` and the user picks the beta option on the interval step.

**Update:** the function must accept the chosen plan's `maxOffers` and write it onto the user. Call signature change:

```ts
activateBetaAccess({
  userId,
  categoryNames,    // [] for Multi/Agency
  categorySlugs,    // [] for Multi/Agency
  maxOffers,        // NEW — from selectedPlan.maxOffers (Multi) or requiredPlan.maxOffers (Single)
})
```

Inside, after the existing role + serviceCategory write, also set `data: { ..., maxOffers, betaAccess: true }`. Multi/Agency beta users get the full per-plan cap.

Beta is available on all three paths (Single, Multi, Agency). The interval-step UI for Multi/Agency still shows the Beta option below the Stripe price options when `BETA_MODE=true`.

## Banner: one-time downgrade notification

When the `customer.subscription.updated` handler auto-drafts excess offers, it sets a timestamp `users.downgradedDraftedAt`. The dashboard reads this and renders a dismissable Alert at the top:

> **Twoja subskrypcja została obniżona.** Część Twoich ofert została automatycznie zapisana jako wersje robocze, aby zmieścić się w limicie nowego planu. Możesz je przejrzeć w sekcji „Oferty" i wybrać, które chcesz opublikować ponownie.

### `users.downgradedDraftedAt` — new optional field

Add to [Users/index.ts](../../src/collections/auth/Users/index.ts) under the same group as `betaAccess`:

```ts
{
  name: 'downgradedDraftedAt',
  type: 'date',
  label: { en: 'Downgrade Draft Banner Cleared At', pl: 'Banner Obniżenia Wyczyszczono O' },
  admin: {
    position: 'sidebar',
    readOnly: true,
    condition: (data, _siblingData, { user }) => isClientRoleEqualOrHigher('moderator', user),
    description: {
      en: 'When set, the dashboard shows a one-time downgrade-drafted banner. Cleared when the user dismisses it.',
      pl: 'Gdy ustawione, pulpit pokazuje jednorazowy banner o automatycznym zapisaniu ofert jako wersje robocze. Czyszczone po zamknięciu.',
    },
  },
}
```

The `users.downgraded_drafted_at` column ALTER is included in the same migration file as `subscription_plans.max_offers` (see "Manual Drizzle migration" above) — one migration, two ALTERs.

Banner dismissal calls a tiny server action `dismissDowngradeDraftedBanner` that sets `downgradedDraftedAt: null` on the user, then `router.refresh()`s.

The banner does NOT count offers precisely — it just shows when `downgradedDraftedAt` is non-null. If you later want a precise count, the webhook can also write a `users.downgradedDraftedCount` int (would require another migration). For v1, the "Część Twoich ofert" copy above is intentionally count-free.

## Existing call sites that need updates

The agent review surfaced two server actions that also write user.serviceCategory and need to handle the Multi/Agency case:

### `updateSubscription.ts` — must handle empty category arrays

[updateSubscription.ts](../../src/actions/stripe/updateSubscription.ts) has multiple paths that unconditionally write `serviceCategory` from category arrays. Apply the same `Array.isArray(x) && x.length > 0` guard before joining + writing. For Multi/Agency callers (none in v1, but the code path needs to be safe), the writes simply don't happen.

Also: when this action processes a plan change in-app (currently only the same-tier "category-only" branch fires), it should write `maxOffers` from the plan looked up by `stripeID`, mirroring the webhook. Otherwise an in-app same-tier change leaves stale `maxOffers`.

### `serviceProviderOnboarding/index.client.tsx` — admin onboarding view

[serviceProviderOnboarding/index.client.tsx:332](../../src/components/payload/views/serviceProviderOnboarding/index.client.tsx) is the legacy admin-panel onboarding view that also calls `createCheckoutSession`. For v1, this admin view stays Single-tier only. **Action:** add a comment in the file noting it doesn't support Multi/Agency, and verify the view is only reachable through admin paths where the user is going Single-tier. If it's no longer reachable in practice, the cleanup is a follow-up.

## Public profile / readers of `user.serviceCategory`

Verified during the review pass — every reader handles the empty case:

| File | Behavior |
|------|----------|
| [konto/AccountSettings.tsx:196](../../src/components/panel/konto/AccountSettings.tsx) | Conditional render — safe |
| [SubscriptionManager.tsx](../../src/components/panel/plan-subskrypcji/SubscriptionManager.tsx) | Fixed in this spec (CardDescription render fix) |
| [oferty/nowa/page.tsx:58](../../src/app/(frontend)/[lang]/panel/oferty/nowa/page.tsx) → `OfferWizardForm.userServiceCategory` | Falls back to empty string default — Multi/Agency users no longer get a category prefilled when creating new offers. **Real UX change** — flag in the implementation plan but no code fix required. |
| [serviceProviderOnboarding/index.tsx:48](../../src/components/payload/views/serviceProviderOnboarding/index.tsx) | Guarded — safe |
| [SubscriptionExpiredBanner](../../src/components/payload/views/customDashboard/SubscriptionExpiredBanner/index.tsx) | Conditional — safe |
| [getOfferCategories.ts:186](../../src/actions/getOfferCategories.ts) | `serviceCategorySlug ?? null` — safe |

There are no public profile pages reading `user.serviceCategory` today — the public offer detail page uses the offer's own `categoryName`/`categorySlug`, not the owner's profile category.

## Existing service-provider migration

Zero-touch.

- All current service-providers have `user.maxOffers = 1` (default).
- The Solo/Business/Enterprise (renamed Single/Single+/Single++) `subscription-plans` records will have `maxOffers = 1` once admin fills them in.
- Their next webhook event writes `1` — same value, no-op.
- No data migration script needed.

## Manual checklist (post-merge runbook)

### Pre-merge: verify migration locally

Before merging the PR:

- [ ] `pnpm payload migrate` runs cleanly on a local DB.
- [ ] `pnpm generate:types` produces a `payload-types.ts` that includes `subscription-plans.maxOffers` and `users.downgradedDraftedAt`.
- [ ] `grep -n "max_offers\|downgraded_drafted_at" src/migrations/*.ts` shows the new migrations.

### Stripe Dashboard — Test mode first, then repeat in Live

1. **Rename existing products** (auto-syncs to Payload, see step 3 about events):
   - [ ] Plan Solo → `Single`
   - [ ] Plan Business → `Single+`
   - [ ] Plan Enterprise → `Single++`

2. **Create the two new products**, each with 3 recurring prices matching the same monthly / 6-month / yearly intervals you have on the Single tier:
   - [ ] `Multi` — 3 prices
   - [ ] `Agency` — 3 prices

3. **Webhook endpoint event subscriptions** — Stripe only sends events you explicitly enable. Easiest path: enable **"Send all events"** on the endpoint; this future-proofs the integration. Alternative: ensure these specific events are checked:
   - [ ] `checkout.session.completed` (existing)
   - [ ] `customer.subscription.created` (existing)
   - [ ] `customer.subscription.deleted` (existing)
   - [ ] `customer.subscription.updated` (**NEW — must be added**, otherwise downgrades won't auto-draft)
   - [ ] `customer.deleted` (existing)
   - [ ] `product.created` (**NEW — required for new Multi/Agency products to sync to Payload**)
   - [ ] `product.updated` (**NEW — required for the rename sync**)

4. **Customer Portal config** (Settings → Billing → Customer Portal):
   - [ ] "Customers can switch plans" enabled.
   - [ ] Add `Multi` and `Agency` to the list of products customers can switch between.
   - [ ] **Restrict downgrades from Multi/Agency to Single via portal.** Easiest: in the portal config, allow Multi ↔ Agency switches, but require Single tier changes to go through cancellation + new wizard. This avoids the edge case where a Stripe-portal Multi→Single downgrade leaves `serviceCategory` empty (the wizard sets it; the portal can't).
   - [ ] Confirm proration behavior is set how you want (default is fine).

### Payload admin (`/app`)

5. After Stripe creates the new products, the sync auto-creates Payload `subscription-plans` records for Multi and Agency. Open each of the **5** plans and confirm/set:
   - [ ] `Single` — `maxOffers = 1`, existing `level`, keep current `features` & `description`
   - [ ] `Single+` — `maxOffers = 1`, existing `level`
   - [ ] `Single++` — `maxOffers = 1`, existing `level`
   - [ ] `Multi` — `maxOffers = 4`, `level` higher than Single++, fill `description` & `features`
   - [ ] `Agency` — `maxOffers = 10`, `level` higher than Multi, fill `description` & `features`
   - [ ] After this step, run a quick query (Payload admin → API → SQL or via local CLI): `SELECT id, name, max_offers FROM subscription_plans WHERE max_offers IS NULL` → expect 0 rows.

6. **Service categories** — no changes. Existing `requiredPlan` mappings still drive Single tiering. Multi and Agency are intentionally not referenced by any category.

### Verification (test mode)

7. **Wizard flow:**
   - [ ] Sign up as a fresh test user, run the Single path → checkout → confirm role promoted, `serviceCategory` set, `maxOffers = 1`.
   - [ ] Sign up as another test user, run the Multi path picking Multi → checkout → confirm `serviceCategory` is `null` (not empty string!), `maxOffers = 4`.
   - [ ] Same for Agency → `maxOffers = 10`.
   - [ ] **Beta on Multi path** (only if `BETA_MODE=true` in test env) — pick Multi, then Beta on the interval step → confirm `betaAccess = true`, `maxOffers = 4`, role promoted.
   - [ ] **Single user "Zmień kategorię"** — flow change to a different Single-tier-eligible category → confirm `serviceCategory` updates and `maxOffers` stays 1.

8. **Downgrade overflow:**
   - [ ] On a test Agency account, publish 6+ offers (use Stripe test card `4242 4242 4242 4242`).
   - [ ] In Stripe Dashboard, change the test subscription's plan to Multi.
   - [ ] Confirm webhook fires (Stripe Dashboard → Webhooks → recent events).
   - [ ] Confirm 2 newest offers got drafted automatically; published count = 4.
   - [ ] **Confirm dashboard banner** appears at next page load with the auto-draft notice.
   - [ ] Try to republish one of the drafted offers → expect a clear validation error toast.
   - [ ] Try to create a new offer → expect "limit reached" (because total is still > new max).
   - [ ] Delete enough drafts to bring total ≤ 4, then create a new offer → expect success.
   - [ ] Dismiss the banner → confirm `downgradedDraftedAt` becomes null and the banner doesn't reappear on refresh.

9. **Upgrade rollback test:**
   - [ ] After step 8, change the subscription back to Agency.
   - [ ] Confirm `user.maxOffers = 10` updates.
   - [ ] Confirm previously-drafted offers stay drafted (we don't auto-republish — user must re-publish manually).

10. **Status view:**
    - [ ] Multi/Agency user → "Zmień kategorię" button hidden.
    - [ ] Single user → "Zmień kategorię" button visible (existing behavior).

### Live cutover

11. Once test mode is verified, repeat steps 1–6 in **Live** Stripe + live Payload admin.
12. Existing service-providers stay on `maxOffers = 1` automatically — their next webhook event writes `1` (same value).

### Follow-up (a billing cycle later)

13. Flip `subscription-plans.maxOffers` to `required: true` in [SubscriptionPlans.ts](../../src/collections/SubscriptionPlans.ts). Keep the `?? 1` fallback in code as defense in depth.
14. Consider adding email notification for downgrade auto-draft (currently dashboard banner only).

## Risks & open questions

- **`customer.subscription.updated` fires on many things** — payment method updates, period rollover, etc. The handler short-circuits before the published-offer query when `maxOffers` is unchanged, so the no-op case is one DB read.
- **Wizard publish at the cap** — the pre-check in `offers.ts` saves as draft and returns `savedAsDraftDueToLimit: true`. Client surfaces a clear toast. No silent failure.
- **Drafted excess sort key** — `createdAt DESC` with `id DESC` tiebreaker. Newest published gets drafted first; older / more established offers stay public. If usage data later suggests sorting by `publishedAt` or another criterion, the sort key in the webhook is the only place to change.
- **Banner copy** — the spec recommends the simpler "Część ofert została zapisana jako wersje robocze" without persisting the exact count. If a precise count is desirable, add `users.downgradedDraftedCount` (also requires a migration).
- **`serviceProviderOnboarding/index.client.tsx`** legacy admin view — kept Single-tier-only for v1. Implementation plan should verify the view is still reachable / decide if it should be removed in a follow-up.
- **Admin-set `description` for Multi and Agency** — this spec doesn't prescribe exact marketing copy. Implementation plan should propose default copy for the plan cards; admin can refine in Payload.
