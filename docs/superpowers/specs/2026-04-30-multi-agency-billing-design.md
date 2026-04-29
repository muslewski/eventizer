# Multi & Agency Subscription Plans — Billing & Wizard Redesign

**Date:** 2026-04-30
**Status:** Approved design, awaiting implementation plan
**Scope:** Add two new subscription tiers ("Multi" and "Agency") that allow multiple offers per service-provider, refactor the `/panel/plan-subskrypcji` wizard to support a "single vs multi" branching flow, and wire up downgrade-overflow handling so the published-offer count never exceeds the subscriber's plan limit.

## Goals

- Introduce two new Stripe products — **Multi** (up to 4 offers) and **Agency** (up to 10 offers) — alongside renaming the existing three Solo / Business / Enterprise products to **Single / Single+ / Single++**.
- Update the subscription wizard so service-providers first decide whether one offer is enough or they need multiple, then proceed through a path appropriate to that mode.
- Enforce **published offers ≤ plan's `maxOffers`** at all times, including auto-drafting excess offers when a user downgrades.
- Keep Stripe billing portal as the single source of truth for plan switches; no in-app upgrade UI in v1.

## Non-goals (explicitly out of scope)

- In-app "Zmień plan" upgrade UI.
- Custom proration logic for upgrades/downgrades (Stripe portal defaults are fine).
- Multi/Agency public profile redesign.
- Migrating existing Single-tier users to Multi/Agency (there's no need — their next webhook event writes the same `maxOffers = 1`).
- Reconciling the dashboard's `atLimit` check ([ServiceProviderDashboard.tsx:52](../../src/components/panel/dashboard/ServiceProviderDashboard.tsx)) which uses `total` instead of `published` — pre-existing inconsistency, not introduced by this change.

## Plan structure

| Plan      | Stripe product    | `maxOffers` | Profile category? | How user reaches it                            |
|-----------|-------------------|-------------|-------------------|------------------------------------------------|
| Single    | renamed from Solo | 1           | required          | Single mode → category drives plan via `requiredPlan` |
| Single+   | renamed from Business | 1       | required          | Single mode → category drives plan via `requiredPlan` |
| Single++  | renamed from Enterprise | 1     | required          | Single mode → category drives plan via `requiredPlan` |
| Multi     | new               | 4           | none              | Multi mode → user picks plan explicitly        |
| Agency    | new               | 10          | none              | Multi mode → user picks plan explicitly        |

Determining whether a user is on a "Multi-class" plan: read `plan.maxOffers > 1`. No new `kind`/`type` field is needed.

## Data model changes

Only one schema-touching change.

### `subscription-plans.maxOffers` — new optional field

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
      en: 'How many offers a subscriber to this plan can have published. Falls back to 1 if not set.',
      pl: 'Ile ofert opublikowanych może mieć subskrybent tego planu. Domyślnie 1, jeśli nie ustawione.',
    },
  },
}
```

- Optional → Payload's auto-sync handles the new nullable column without a manual Drizzle migration.
- All consumers read it as `plan.maxOffers ?? 1`.
- Once all five plans have the value populated in admin, a follow-up PR flips `required: true`.

### Unchanged

- `users.maxOffers` — already exists with default 1. Webhooks will start writing to it.
- `users.serviceCategory` / `users.serviceCategorySlug` — stay text paths. For Multi/Agency users they remain empty (`null`).
- `service-categories.requiredPlan` — unchanged. It still drives the Single tier mapping. Multi/Agency are never referenced by any category.
- `Offers` schema — unchanged. New publish-cap hook is added (see below) but no fields move.

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

Plus `mode: 'single' | 'multi'` and `selectedPlan: SubscriptionPlan | null` (Multi path only — Single path keeps the existing `getRequiredPlanFromCategory` derivation).

Initial view for new users: `onboarding-mode` (was `onboarding-category`).

### Step 1 — Mode picker (new for everyone)

Two large cards with explanatory copy that disambiguates "więcej":

- **Jedno ogłoszenie wystarczy** — "Świadczę jedną główną usługę (np. tylko jako DJ albo tylko catering). Idealne, jeśli skupiasz się na jednej specjalizacji."
- **Więcej ofert** — "Świadczę kilka różnych usług (np. DJ + catering, fotograf + dekoracje). Najczęściej wybierane przez agencje i firmy oferujące wiele specjalizacji jednocześnie."

Single → `onboarding-category`. Multi → `onboarding-plan`.

### Step 2 — Plan picker (Multi path only)

Two cards: **Multi** and **Agency**. Each shows:

- Plan name (Bebas, large) and offer-limit badge ("Do 4 ofert" / "Do 10 ofert")
- Description (`plan.description`)
- Pricing strip below the body, smaller and muted, e.g. `99 zł / miesiąc` on one line and `999 zł / rok` on the next. No interval radio. No "this is the price you're paying" framing — purely informational so the user can gauge tier.
- Single "Wybierz" button per card.

Pricing for the strip (cheapest monthly + cheapest yearly per plan, ignoring the 6-month interval) is fetched server-side in [page.tsx](../../src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx) (one extra `getStripePrices` call per plan, parallel to existing data fetches) and passed down as `planSummaries` prop. Avoids client-side fetch flicker.

### Step 2 — Category picker (Single path only)

Unchanged. `CategoryPicker` shows the full hierarchy; plan is derived from the chosen category via `getRequiredPlanFromCategory`.

For Multi path: **the category step is skipped entirely**. A multi-service provider has no single primary category by definition; per-offer categories are picked at offer-creation time inside the offer wizard.

### Step 3 — Interval picker (both paths)

Identical to today's `onboarding-price` view. The only difference is which `stripeProductId` is passed to `getStripePrices`:

- Single path: `getRequiredPlanFromCategory(...).stripeID` (current logic).
- Multi path: `selectedPlan.stripeID`.

Both paths converge on the same `createCheckoutSession` flow.

### Progress indicator

Both paths are 3 steps total:

- Single: `Krok N z 3` — mode → category → interval
- Multi: `Krok N z 3` — mode → plan → interval

### Status view tweaks

In the status view of [SubscriptionManager.tsx](../../src/components/panel/plan-subskrypcji/SubscriptionManager.tsx):

- **"Zmień kategorię" button** — hide when `subscription.currentPlan?.maxOffers > 1` (Multi/Agency users have no profile category to change). Single users keep the existing behavior (re-runs the wizard, recheckout if tier changes).
- **"Kategoria: X" text** in the status `CardDescription` is already conditional on `user.serviceCategory` being truthy — naturally hides for Multi/Agency.
- **No "Zmień plan" button.** Plan changes go through "Zarządzaj płatnościami" → Stripe billing portal.

## Checkout payload changes

In [createCheckoutSession.ts](../../src/actions/stripe/createCheckoutSession.ts), no signature changes are required. For Multi/Agency, the wizard simply passes `categoryNames: []` and `categorySlugs: []`. The existing webhook handlers already use `Array.isArray(...)` checks before writing the category fields, so empty arrays naturally skip the category writes.

## Webhook handler changes

In [plugins/index.ts](../../src/plugins/index.ts).

### `checkout.session.completed` (modify existing)

Currently sets `role` and optionally `serviceCategory` / `serviceCategorySlug`. **Add:** look up `subscription-plans` by the new subscription's product ID and write `plan.maxOffers ?? 1` onto `user.maxOffers` in the same `payload.update` call.

To resolve the product ID inside this handler we need the subscription, not just the session — fetch it via `stripe.subscriptions.retrieve(session.subscription)` if `session.subscription` is set. (The session itself doesn't include line items unless expanded.)

### `customer.subscription.created` (modify existing)

Same addition. This is the redundant fallback handler that runs when `checkout.session.completed` is missed. Reads the subscription's product ID directly from `event.data.object.items.data[0].price.product`.

### `customer.subscription.updated` (NEW handler)

The plan-change / upgrade / downgrade engine. Pseudocode:

```ts
'customer.subscription.updated': async ({ event, payload }) => {
  const sub = event.data.object
  if (sub.status !== 'active' && sub.status !== 'trialing') return

  // Resolve user via stripe-customers
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

  // Resolve product → plan → maxOffers
  const productId = typeof sub.items.data[0].price.product === 'string'
    ? sub.items.data[0].price.product
    : sub.items.data[0].price.product.id
  const plans = await payload.find({
    collection: 'subscription-plans',
    where: { stripeID: { equals: productId } },
    limit: 1,
  })
  const newMax = plans.docs[0]?.maxOffers ?? 1

  // Update user.maxOffers if changed
  const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 })
  if (user.maxOffers !== newMax) {
    await payload.update({
      collection: 'users',
      id: userId,
      data: { maxOffers: newMax },
    })
  }

  // Drift correction: if currently published > newMax, draft the newest excess
  const published = await payload.find({
    collection: 'offers',
    where: {
      user: { equals: userId },
      _status: { equals: 'published' },
    },
    sort: '-createdAt',
    limit: 0,
    depth: 0,
  })
  if (published.docs.length > newMax) {
    const excess = published.docs.slice(0, published.docs.length - newMax)
    await Promise.all(
      excess.map((offer) =>
        payload.update({
          collection: 'offers',
          id: offer.id,
          data: { _status: 'draft' },
        }),
      ),
    )
    payload.logger.info(
      `customer.subscription.updated: Drafted ${excess.length} offers for user ${userId} due to plan downgrade (newMax=${newMax})`,
    )
  }
}
```

### `customer.subscription.deleted` (no change)

Already drafts all of the user's offers and reverts to client. Good as-is.

## Publish-cap enforcement

Add a new `beforeChange` hook on the Offers collection — `enforceMaxPublishedOffers` — separate file from the existing `enforceMaxOffers` to keep concerns isolated:

```ts
// src/collections/Offers/hooks/enforceMaxPublishedOffers.ts
import { isClientRoleEqualOrHigher } from '@/access/utilities'
import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'

export const enforceMaxPublishedOffers: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Only enforce on transitions to published
  const willBePublished = data._status === 'published'
  const wasPublished = originalDoc?._status === 'published'
  if (!willBePublished || wasPublished) return data

  // Bypass for moderators+
  if (!req.user || isClientRoleEqualOrHigher('moderator', req.user)) return data

  const userMax = (req.user as { maxOffers?: number | null }).maxOffers ?? 1
  const ownerId = originalDoc?.user ?? data.user ?? req.user.id

  const currentlyPublished = await req.payload.find({
    collection: 'offers',
    where: {
      user: { equals: typeof ownerId === 'object' ? ownerId.id : ownerId },
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

Wire it up in the Offers collection config alongside `enforceMaxOffers`. Existing `enforceMaxOffers` (total ≤ max on create) stays as-is.

### Wizard publish failure UX

The offer wizard publishes at the end of the flow ([offers.ts](../../src/actions/panel/offers.ts) — see [eventizer-offers-wizard skill]). When `enforceMaxPublishedOffers` throws, the server action should:

- Catch the `ValidationError` specifically.
- Save the offer as a draft instead of publishing.
- Return a structured success result with a flag like `savedAsDraftDueToLimit: true` so the client can show a clear toast: "Limit ofert opublikowanych osiągnięty — ta oferta została zapisana jako wersja robocza."

This is the only UX hand-holding needed; everywhere else the validation error surfaces naturally.

## Existing service-provider migration

Zero-touch.

- Current service-providers all have `user.maxOffers = 1` (default).
- The Solo/Business/Enterprise (renamed Single/Single+/Single++) `subscription-plans` records will get `maxOffers = 1` once admin fills them in.
- The next webhook event for an existing user writes `1` to `user.maxOffers` — same value, no-op.
- No data migration script needed.

## Manual checklist (post-merge runbook)

This is the order of operations once the code is merged.

### Stripe Dashboard — Test mode first, then repeat in Live

1. **Rename existing products** (auto-syncs to Payload via the Stripe plugin):
   - [ ] Plan Solo → `Single`
   - [ ] Plan Business → `Single+`
   - [ ] Plan Enterprise → `Single++`

2. **Create the two new products**, each with 3 recurring prices matching the same monthly / 6-month / yearly intervals you have on the Single tier:
   - [ ] `Multi` — 3 prices
   - [ ] `Agency` — 3 prices

3. **Webhook endpoint event subscriptions** — verify the endpoint that points at your app has these events enabled:
   - [ ] `checkout.session.completed` (existing)
   - [ ] `customer.subscription.created` (existing)
   - [ ] `customer.subscription.deleted` (existing)
   - [ ] `customer.subscription.updated` (**NEW — must be added**, otherwise downgrades won't auto-draft)
   - [ ] `customer.deleted` (existing)

4. **Customer Portal config** (Settings → Billing → Customer Portal):
   - [ ] "Customers can switch plans" enabled.
   - [ ] Add `Multi` and `Agency` to the list of products customers can switch to.
   - [ ] Confirm proration behavior is set how you want (default is fine).

### Payload admin (`/app`)

5. After Stripe creates the new products, the sync auto-creates Payload `subscription-plans` records for Multi and Agency. Open each of the **5** plans and confirm/set:
   - [ ] `Single` — `maxOffers = 1`, existing `level`, keep current `features` & `description`
   - [ ] `Single+` — `maxOffers = 1`, existing `level`
   - [ ] `Single++` — `maxOffers = 1`, existing `level`
   - [ ] `Multi` — `maxOffers = 4`, `level` higher than Single++, fill `description` & `features`
   - [ ] `Agency` — `maxOffers = 10`, `level` higher than Multi, fill `description` & `features`

6. **Service categories** — no changes. Existing `requiredPlan` mappings still drive Single tiering. Multi and Agency are intentionally not referenced by any category.

### Verification (test mode)

7. **Wizard flow:**
   - [ ] Sign up as a fresh test user, run the Single path → checkout → confirm role promoted, `serviceCategory` set, `maxOffers = 1`.
   - [ ] Sign up as another test user, run the Multi path picking Multi → checkout → confirm `serviceCategory` empty, `serviceCategorySlug` empty, `maxOffers = 4`.
   - [ ] Same for Agency → `maxOffers = 10`.

8. **Downgrade overflow:**
   - [ ] On a test Agency account, publish 6+ offers.
   - [ ] In Stripe Dashboard, change the test subscription's plan to Multi.
   - [ ] Confirm webhook fires (Stripe Dashboard → Webhooks → recent events).
   - [ ] Confirm 2 newest offers got drafted automatically; published count = 4.
   - [ ] Try to republish one of the drafted offers in the panel → expect a clear validation error toast.

9. **Status view:**
   - [ ] Multi/Agency user → "Zmień kategorię" button hidden.
   - [ ] Single user → "Zmień kategorię" button visible (existing behavior).

### Live cutover

10. Once test mode is verified, repeat steps 1–6 in **Live** Stripe + live Payload admin.
11. Existing service-providers stay on `maxOffers = 1` automatically — their next webhook event writes `1` (same value).

### Follow-up (later)

12. Once all 5 plans have `maxOffers` populated and have been live for a billing cycle, flip `subscription-plans.maxOffers` to `required: true` in [SubscriptionPlans.ts](../../src/collections/SubscriptionPlans.ts). Cleans up the optional fallback.

## Risks & open questions

- **Wizard mid-flow drafts.** If a user starts the offer wizard at the cap (e.g. an Agency user with 10 published, then downgrades, then tries to publish a draft they were working on), the publish-cap hook fires server-side. Surface this gracefully via the `savedAsDraftDueToLimit` flag in the offer-publish action's return.
- **`customer.subscription.updated` fires on many things** — not only product changes (also payment method updates, status changes, etc.). The handler reads the current product → plan → `maxOffers` every time and only writes if the value actually differs from the user's current value, so the no-op case is cheap.
- **Sorting drafted excess.** "Newest published get drafted first" was the chosen rule (older / more established offers stay public). If usage data later suggests a different criterion (e.g. lowest impressions), the sort key in the webhook handler is the only place to change.
- **Public profile pages for Multi/Agency users** with empty `user.serviceCategory` aren't redesigned here. The implementation plan should call out a quick scan of every reader of `user.serviceCategory` to confirm nothing renders awkwardly with an empty value.
