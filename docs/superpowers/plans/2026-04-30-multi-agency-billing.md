# Multi & Agency Subscription Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Multi (4 offers) and Agency (10 offers) subscription tiers alongside the renamed Single/Single+/Single++ Stripe products, refactor `/panel/plan-subskrypcji` into a mode-branched wizard, and wire downgrade auto-draft + publish-cap so the published-offer count never exceeds the active plan's `maxOffers`.

**Architecture:** New optional `subscription-plans.maxOffers` field drives per-plan offer limits. Webhooks (`checkout.session.completed`, `customer.subscription.created`, new `customer.subscription.updated`) keep `users.maxOffers` synced and auto-draft excess on downgrade. A new `enforceMaxPublishedOffers` `beforeChange` hook on Offers blocks publish-transitions past the cap. The wizard adds two new views (`onboarding-mode`, `onboarding-plan`); the Multi path skips category selection. A dashboard `Alert` triggered by a new `users.downgradedDraftedAt` field surfaces the auto-draft event.

**Tech Stack:** Payload CMS 3.75 + Drizzle on Vercel Postgres + `@payloadcms/plugin-stripe` + Next.js 16 App Router + shadcn/ui + Sonner toasts + `unstable_cache` for plan price summaries.

**Spec:** [docs/superpowers/specs/2026-04-30-multi-agency-billing-design.md](../specs/2026-04-30-multi-agency-billing-design.md). Refer to it for context, copy, and the post-merge runbook.

**Verification ground rules:** This codebase has vitest configured but no `*.test.ts` files in `src/`. Verification is done via `pnpm generate:types`, `pnpm payload migrate`, `pnpm lint`, and dev-server smoke tests. Each task ends in a commit so the branch is always shippable.

---

## File map

**New files:**
- `src/migrations/<TS>_add_billing_tier_fields.ts` — Drizzle ALTER for `subscription_plans.max_offers` + `users.downgraded_drafted_at`
- `src/collections/Offers/hooks/enforceMaxPublishedOffers.ts` — beforeChange hook capping published count
- `src/actions/stripe/products/getPlanPriceSummary.ts` — cached cheapest-monthly/yearly fetch per plan
- `src/actions/panel/dismissDowngradeDraftedBanner.ts` — server action that nulls `downgradedDraftedAt`
- `src/components/panel/plan-subskrypcji/PlanModeCard.tsx` — step 1 mode picker card
- `src/components/panel/plan-subskrypcji/PlanPickerCard.tsx` — step 2 plan picker card with subtle dual-price strip
- `src/components/panel/dashboard/DowngradeDraftedBanner.tsx` — one-time downgrade alert

**Modified:**
- `src/migrations/index.ts` — register the new migration
- `src/collections/SubscriptionPlans.ts` — add `maxOffers` field
- `src/collections/auth/Users/index.ts` — add `downgradedDraftedAt` field
- `src/collections/Offers/index.ts` — wire the new hook
- `src/collections/Offers/hooks/index.ts` — export the new hook
- `src/plugins/index.ts` — modify `checkout.session.completed`, `customer.subscription.created`; add `customer.subscription.updated`; tighten `Array.isArray && length > 0` checks
- `src/actions/stripe/createCheckoutSession.ts` — pass empty arrays through cleanly (no signature change; verify only)
- `src/actions/stripe/activateBetaAccess.ts` — accept and write `maxOffers`
- `src/actions/stripe/updateSubscription.ts` — guard empty arrays, write `maxOffers` from plan
- `src/actions/panel/offers.ts` — pre-check publish-cap; tighten error path; new return shape
- `src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx` — fetch plan summaries server-side
- `src/components/panel/plan-subskrypcji/SubscriptionManager.tsx` — new views, branched wizard
- `src/app/(frontend)/[lang]/panel/dashboard/page.tsx` — render the downgrade banner
- `src/components/panel/dashboard/ServiceProviderDashboard.tsx` — leave `atLimit` calc untouched (out of scope)

---

## Task 1: Add `maxOffers` field to SubscriptionPlans

**Files:**
- Modify: `src/collections/SubscriptionPlans.ts`

- [ ] **Step 1: Add the field**

In `src/collections/SubscriptionPlans.ts`, insert this object into the `fields` array (after `level`, before `highlighted`):

```ts
{
  name: 'maxOffers',
  type: 'number',
  required: false,
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
},
```

- [ ] **Step 2: Regenerate types**

Run: `pnpm generate:types`
Expected: no errors. After it runs, `grep -n "maxOffers" src/payload-types.ts` should show the field on the `SubscriptionPlan` interface.

- [ ] **Step 3: Commit**

```bash
git add src/collections/SubscriptionPlans.ts src/payload-types.ts
git commit -m "feat(billing): add subscription-plans.maxOffers optional field"
```

---

## Task 2: Add `downgradedDraftedAt` field to Users

**Files:**
- Modify: `src/collections/auth/Users/index.ts`

- [ ] **Step 1: Add the field**

In `src/collections/auth/Users/index.ts`, find the `betaAccess` field block (near line 236). Insert this field directly *after* the `betaAccess` field block in the same `fields` array (same indent / same nesting level):

```ts
{
  name: 'downgradedDraftedAt',
  type: 'date',
  label: {
    en: 'Downgrade Draft Banner Set At',
    pl: 'Banner Obniżenia Ustawiono O',
  },
  admin: {
    position: 'sidebar',
    readOnly: true,
    description: {
      en: 'When set, the dashboard shows a one-time banner about offers auto-drafted due to a plan downgrade. Cleared when the user dismisses the banner.',
      pl: 'Gdy ustawione, pulpit pokazuje jednorazowy banner o automatycznym zapisaniu ofert jako wersje robocze po obniżeniu planu. Czyszczone po zamknięciu.',
    },
    condition: (_data, _siblingData, { user }) =>
      isClientRoleEqualOrHigher('moderator', user),
  },
},
```

`isClientRoleEqualOrHigher` is already imported at the top of the file. No new imports.

- [ ] **Step 2: Regenerate types**

Run: `pnpm generate:types`
Expected: no errors. `grep -n "downgradedDraftedAt" src/payload-types.ts` should show the new field on the `User` interface.

- [ ] **Step 3: Commit**

```bash
git add src/collections/auth/Users/index.ts src/payload-types.ts
git commit -m "feat(billing): add users.downgradedDraftedAt field for downgrade banner"
```

---

## Task 3: Write the Drizzle migration

**Files:**
- Create: `src/migrations/<NEW_TIMESTAMP>_add_billing_tier_fields.ts`
- Modify: `src/migrations/index.ts`

- [ ] **Step 1: Pick a timestamp**

Run: `date +%Y%m%d_%H%M%S` and use that string as `<NEW_TIMESTAMP>` in the next steps. (Example output: `20260430_143000`.)

- [ ] **Step 2: Create the migration file**

Create `src/migrations/<NEW_TIMESTAMP>_add_billing_tier_fields.ts` with this exact content:

```ts
// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds `max_offers` to subscription_plans (per-plan offer cap, optional)
 * and `downgraded_drafted_at` to users (timestamp triggering the dashboard
 * downgrade-drafted banner). Neither table is versioned, so a single ALTER
 * each is enough.
 */
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

- [ ] **Step 3: Register the migration**

In `src/migrations/index.ts`, add an import line at the top and a registration entry at the end of the array. The file is currently:

```ts
import * as migration_20251217_102626_backup_before_switch from './20251217_102626_backup_before_switch';
import * as migration_20260420_204841_add_offer_website from './20260420_204841_add_offer_website';
import * as migration_20260423_120000_add_offer_upload_zoom from './20260423_120000_add_offer_upload_zoom';

export const migrations = [
  // ... existing entries
];
```

Add the new import below the existing imports:

```ts
import * as migration_<NEW_TIMESTAMP>_add_billing_tier_fields from './<NEW_TIMESTAMP>_add_billing_tier_fields';
```

And add this entry at the end of the `migrations` array (inside the `[]`, after the last existing object):

```ts
  {
    up: migration_<NEW_TIMESTAMP>_add_billing_tier_fields.up,
    down: migration_<NEW_TIMESTAMP>_add_billing_tier_fields.down,
    name: '<NEW_TIMESTAMP>_add_billing_tier_fields'
  },
```

Replace `<NEW_TIMESTAMP>` everywhere with the value from Step 1.

- [ ] **Step 4: Apply locally**

Run: `pnpm payload migrate`
Expected: console output shows "Running migration <NEW_TIMESTAMP>_add_billing_tier_fields..." then "Done." If it errors with "column already exists", that's fine (the migration is idempotent via `IF NOT EXISTS`).

- [ ] **Step 5: Verify**

Run: `grep -n "max_offers\|downgraded_drafted_at" src/migrations/*.ts`
Expected: at least 4 matches (UP + DOWN for each column).

- [ ] **Step 6: Commit**

```bash
git add src/migrations/
git commit -m "feat(billing): add migration for subscription_plans.max_offers and users.downgraded_drafted_at"
```

---

## Task 4: Implement `enforceMaxPublishedOffers` hook

**Files:**
- Create: `src/collections/Offers/hooks/enforceMaxPublishedOffers.ts`
- Modify: `src/collections/Offers/hooks/index.ts`
- Modify: `src/collections/Offers/index.ts`

- [ ] **Step 1: Create the hook file**

Create `src/collections/Offers/hooks/enforceMaxPublishedOffers.ts`:

```ts
import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'
import { isClientRoleEqualOrHigher } from '@/access/utilities'

/**
 * Blocks transitions to `_status: 'published'` when the offer's owner already
 * has `maxOffers` published offers. Drafts are unaffected — this hook only
 * fires when an offer is becoming newly published.
 *
 * Owner's `maxOffers` is read from the user record, NOT `req.user`. That way
 * a moderator publishing on someone's behalf, or a server-action calling
 * payload.update without a `req`, both enforce the owner's limit correctly.
 */
export const enforceMaxPublishedOffers: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const willBePublished = (data as { _status?: string })._status === 'published'
  const wasPublished = (originalDoc as { _status?: string } | undefined)?._status === 'published'
  if (!willBePublished || wasPublished) return data

  // Bypass for moderators/admins acting with a session
  if (req.user && isClientRoleEqualOrHigher('moderator', req.user)) return data

  // Resolve owner from originalDoc (update) or data (create)
  const rawOwner = (originalDoc as { user?: unknown } | undefined)?.user ?? (data as { user?: unknown }).user
  if (rawOwner === undefined || rawOwner === null) return data
  const ownerId = typeof rawOwner === 'object' ? (rawOwner as { id: number }).id : (rawOwner as number)

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

- [ ] **Step 2: Re-export the hook**

In `src/collections/Offers/hooks/index.ts`, add this line after the existing exports:

```ts
export { enforceMaxPublishedOffers } from './enforceMaxPublishedOffers'
```

The file should now be:

```ts
export { enforceMaxOffers } from './enforceMaxOffers'
export { validateCategory } from './validateCategory'
export { populateCategoryData } from './populateCategoryData'
export { revalidateOffer, revalidateOfferOnDelete } from './revalidateFeaturedOffers'
export { enforceMaxPublishedOffers } from './enforceMaxPublishedOffers'
```

- [ ] **Step 3: Wire the hook into the collection**

In `src/collections/Offers/index.ts`, update the import line:

```ts
import {
  enforceMaxOffers,
  validateCategory,
  populateCategoryData,
  revalidateOffer,
  revalidateOfferOnDelete,
  enforceMaxPublishedOffers,
} from './hooks'
```

Update the `hooks` block to add `enforceMaxPublishedOffers` to `beforeChange`. The block is currently:

```ts
hooks: {
  beforeOperation: [enforceMaxOffers],
  beforeValidate: [validateCategory],
  beforeChange: [populateCategoryData],
  afterChange: [revalidateOffer],
  afterDelete: [revalidateOfferOnDelete],
},
```

Change it to:

```ts
hooks: {
  beforeOperation: [enforceMaxOffers],
  beforeValidate: [validateCategory],
  beforeChange: [enforceMaxPublishedOffers, populateCategoryData],
  afterChange: [revalidateOffer],
  afterDelete: [revalidateOfferOnDelete],
},
```

Order matters: `enforceMaxPublishedOffers` runs first so that an early throw skips the `populateCategoryData` work.

- [ ] **Step 4: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `pnpm lint -- src/collections/Offers`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Offers/
git commit -m "feat(billing): add enforceMaxPublishedOffers hook for publish-cap"
```

---

## Task 5: Add `customer.subscription.updated` webhook + extend other handlers

**Files:**
- Modify: `src/plugins/index.ts`

- [ ] **Step 1: Tighten array-empty checks in `checkout.session.completed`**

In `src/plugins/index.ts`, find the `checkout.session.completed` handler (around line 90). Inside the try block, locate:

```ts
if (categoryNames && Array.isArray(categoryNames)) {
  updateData.serviceCategory = categoryNames.join(' > ')
}
if (categorySlugs && Array.isArray(categorySlugs)) {
  updateData.serviceCategorySlug = categorySlugs.join('/')
}
```

Replace with:

```ts
if (Array.isArray(categoryNames) && categoryNames.length > 0) {
  updateData.serviceCategory = categoryNames.join(' > ')
}
if (Array.isArray(categorySlugs) && categorySlugs.length > 0) {
  updateData.serviceCategorySlug = categorySlugs.join('/')
}
```

- [ ] **Step 2: Add `maxOffers` write to `checkout.session.completed`**

Inside the same handler, *immediately before* the `await payload.update({ collection: 'users', ... data: updateData })` call, add the maxOffers lookup. The session has `subscription` (string ID); we must retrieve it to read product:

```ts
// Resolve maxOffers from the new subscription's product
if (session.subscription) {
  try {
    const stripeSub = await stripe.subscriptions.retrieve(session.subscription)
    const productId =
      typeof stripeSub.items.data[0]?.price.product === 'string'
        ? stripeSub.items.data[0].price.product
        : stripeSub.items.data[0]?.price.product?.id
    if (productId) {
      const plans = await payload.find({
        collection: 'subscription-plans',
        where: { stripeID: { equals: productId } },
        limit: 1,
      })
      const planMax = plans.docs[0]?.maxOffers ?? 1
      updateData.maxOffers = planMax
    }
  } catch (subErr) {
    console.error('checkout.session.completed: failed to resolve maxOffers', subErr)
    // Fall through — user is still promoted, maxOffers stays at default 1
  }
}
```

The `stripe` client is already imported at the top of the file. No new imports.

- [ ] **Step 3: Tighten array-empty checks + add maxOffers to `customer.subscription.created`**

Find the `customer.subscription.created` handler (around line 320). Apply the same `Array.isArray(x) && x.length > 0` change, and inside the same handler, immediately *before* the `payload.update({ collection: 'users', ... data: updateData })` call, add:

```ts
// Resolve maxOffers from the subscription's product
const productId =
  typeof subscription.items?.data?.[0]?.price?.product === 'string'
    ? subscription.items.data[0].price.product
    : subscription.items?.data?.[0]?.price?.product?.id
if (productId) {
  const plans = await payload.find({
    collection: 'subscription-plans',
    where: { stripeID: { equals: productId } },
    limit: 1,
  })
  updateData.maxOffers = plans.docs[0]?.maxOffers ?? 1
}
```

Note: the existing handler types `subscription` as `{ id: string; customer: string; status: string; metadata: ... }`. Extend that inline type to include `items`:

```ts
const subscription = event.data.object as {
  id: string
  customer: string
  status: string
  metadata: Record<string, string> | null
  items?: { data?: Array<{ price?: { product?: string | { id: string } } }> }
}
```

- [ ] **Step 4: Add `customer.subscription.updated` handler**

Inside the `webhooks` object, after `customer.subscription.created` and before `'customer.deleted'`, add this new handler:

```ts
'customer.subscription.updated': async ({ event, payload }) => {
  try {
    const sub = event.data.object as {
      id: string
      customer: string | { id: string }
      status: string
      items: { data: Array<{ price: { product: string | { id: string } } }> }
    }

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

    // Resolve product → plan → newMax
    const item = sub.items?.data?.[0]
    if (!item) return
    const productId = typeof item.price.product === 'string' ? item.price.product : item.price.product.id
    const plans = await payload.find({
      collection: 'subscription-plans',
      where: { stripeID: { equals: productId } },
      limit: 1,
    })
    const newMax = plans.docs[0]?.maxOffers ?? 1

    // Short-circuit if value unchanged — common case for non-product events
    const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 })
    if (user.maxOffers === newMax) return

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
      sort: ['-createdAt', '-id'],
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

      // Set the banner trigger
      await payload.update({
        collection: 'users',
        id: userId,
        data: { downgradedDraftedAt: new Date().toISOString() },
      })
    }
  } catch (err) {
    payload.logger.error('customer.subscription.updated handler failed', err)
  }
},
```

- [ ] **Step 5: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. If you see "Property 'maxOffers' does not exist on type 'User'", you missed Tasks 1 or 2 — re-run `pnpm generate:types`.

- [ ] **Step 6: Commit**

```bash
git add src/plugins/index.ts
git commit -m "feat(billing): wire maxOffers in webhooks + add customer.subscription.updated handler"
```

---

## Task 6: Update `activateBetaAccess` to write `maxOffers`

**Files:**
- Modify: `src/actions/stripe/activateBetaAccess.ts`

- [ ] **Step 1: Add `maxOffers` to the params interface and the update call**

Replace the entire body of `activateBetaAccess` to thread `maxOffers` through. The new file content:

```ts
'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { updateUserServiceCategory } from '@/actions/user/updateUserServiceCategory'

export interface ActivateBetaAccessResult {
  success: boolean
  error?: string
}

/**
 * Activates beta (free) service-provider access for a user. Skips Stripe
 * entirely. The caller passes `maxOffers` from the chosen plan so beta users
 * on Multi/Agency get the correct cap (4 / 10) instead of the default 1.
 */
export async function activateBetaAccess({
  userId,
  categoryNames,
  categorySlugs,
  maxOffers,
}: {
  userId: number
  categoryNames: string[]
  categorySlugs: string[]
  maxOffers: number
}): Promise<ActivateBetaAccessResult> {
  try {
    // Save category only if the path is non-empty (Multi/Agency pass [])
    if (categoryNames.length > 0 && categorySlugs.length > 0) {
      const categoryResult = await updateUserServiceCategory({
        userId: String(userId),
        categoryNames,
        categorySlugs,
      })
      if (!categoryResult.success) {
        return { success: false, error: categoryResult.error || 'Nie udało się zapisać kategorii.' }
      }
    }

    const payload = await getPayload({ config })

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    })

    if (!user) {
      return { success: false, error: 'Użytkownik nie został znaleziony.' }
    }

    if (user.role !== 'client' && user.role !== 'service-provider') {
      return {
        success: false,
        error: 'Tylko klienci lub usługodawcy mogą aktywować dostęp beta.',
      }
    }

    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        role: 'service-provider',
        betaAccess: true,
        maxOffers,
      },
    })

    payload.logger.info(`Beta access activated for user ${userId} (maxOffers=${maxOffers})`)

    return { success: true }
  } catch (error) {
    console.error('Error activating beta access:', error)
    return { success: false, error: 'Wystąpił błąd podczas aktywacji dostępu beta.' }
  }
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: errors appear at the *callers* of `activateBetaAccess` because the signature changed. Note where they are — these will be fixed in Task 11 (SubscriptionManager refactor). Don't fix the call sites yet.

- [ ] **Step 3: Commit**

```bash
git add src/actions/stripe/activateBetaAccess.ts
git commit -m "feat(billing): activateBetaAccess now writes maxOffers from chosen plan"
```

---

## Task 7: Tighten `updateSubscription.ts` empty-array guards + maxOffers sync

**Files:**
- Modify: `src/actions/stripe/updateSubscription.ts`

- [ ] **Step 1: Build a small helper, gate all writes through it**

In `src/actions/stripe/updateSubscription.ts`, add this helper at the top of the file (after imports, before the `UpdateSubscriptionResult` interface):

```ts
type CategoryWriteData = {
  serviceCategory?: string | null
  serviceCategorySlug?: string | null
}

function buildCategoryWrite(
  categoryNames: string[],
  categorySlugs: string[],
): CategoryWriteData {
  if (categoryNames.length > 0 && categorySlugs.length > 0) {
    return {
      serviceCategory: categoryNames.join(' > '),
      serviceCategorySlug: categorySlugs.join('/'),
    }
  }
  return { serviceCategory: null, serviceCategorySlug: null }
}
```

- [ ] **Step 2: Replace each `payload.update` user-data block**

There are three `payload.update({ collection: 'users', ... })` calls in the file. In each one, replace the inline `data: { serviceCategory: ..., serviceCategorySlug: ... }` with `data: buildCategoryWrite(categoryNames, categorySlugs)`.

The same-plan interval-change branch (around line 88) — the `data` object becomes:

```ts
data: buildCategoryWrite(categoryNames, categorySlugs),
```

The category-only branch (around line 106) — same replacement.

The upgrade/downgrade branch at the end (around line 200) — same replacement, but ALSO chain the maxOffers update:

```ts
const newMaxOffers = newPlan.docs[0]?.maxOffers ?? 1
await payload.update({
  collection: 'users',
  id: userId,
  data: {
    ...buildCategoryWrite(categoryNames, categorySlugs),
    maxOffers: newMaxOffers,
  },
})
```

(The `newPlan` variable already exists from the level lookup earlier in the function.)

- [ ] **Step 3: Type-check + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint -- src/actions/stripe/updateSubscription.ts`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/actions/stripe/updateSubscription.ts
git commit -m "feat(billing): updateSubscription handles empty arrays and writes maxOffers"
```

---

## Task 8: Add publish-cap pre-check to offers server actions

**Files:**
- Modify: `src/actions/panel/offers.ts`

- [ ] **Step 1: Add a helper to count published offers for a user**

In `src/actions/panel/offers.ts`, add this helper at the top of the file (after `describeSaveError`, before `getOffers`):

```ts
async function isAtPublishedLimit(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: number,
  excludeOfferId?: number,
): Promise<{ atLimit: boolean; max: number; published: number }> {
  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
  })
  const max = user?.maxOffers ?? 1

  const published = await payload.find({
    collection: 'offers',
    where: {
      user: { equals: userId },
      _status: { equals: 'published' },
      ...(excludeOfferId ? { id: { not_equals: excludeOfferId } } : {}),
    },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  return { atLimit: published.totalDocs >= max, max, published: published.totalDocs }
}
```

- [ ] **Step 2: Pre-check inside `createOffer`**

Replace the body of `createOffer` (lines 99-123) with:

```ts
export async function createOffer(data: Partial<Offer>) {
  try {
    const user = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const requestedStatus = (data as any)._status
    const wantsPublish = requestedStatus === 'published'
    let isDraft = requestedStatus === 'draft' || !requestedStatus

    let savedAsDraftDueToLimit = false
    let limitMax: number | null = null

    // Pre-check: if user is publishing but already at the cap, save as draft
    if (wantsPublish) {
      const { atLimit, max } = await isAtPublishedLimit(payload, Number(user.id))
      if (atLimit) {
        savedAsDraftDueToLimit = true
        limitMax = max
        isDraft = true
        ;(data as any)._status = 'draft'
      }
    }

    const result = await payload.create({
      collection: 'offers',
      data: {
        ...data,
        user: Number(user.id),
      } as Offer,
      draft: isDraft,
      overrideAccess: true,
    })

    if (savedAsDraftDueToLimit) {
      return {
        success: true as const,
        data: result,
        savedAsDraftDueToLimit: true,
        message: `Limit ofert opublikowanych (${limitMax}) został osiągnięty — oferta została zapisana jako wersja robocza.`,
      }
    }

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[createOffer]', err)
    return {
      success: false as const,
      error: describeSaveError(err, 'Nie udało się utworzyć oferty'),
    }
  }
}
```

- [ ] **Step 3: Pre-check inside `updateOffer`**

Replace the body of `updateOffer` (lines 125-147) with:

```ts
export async function updateOffer(id: number, data: Partial<Offer>) {
  try {
    const sessionUser = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const requestedStatus = (data as any)._status
    const wantsPublish = requestedStatus === 'published'
    let isDraft = requestedStatus === 'draft' || !requestedStatus

    let savedAsDraftDueToLimit = false
    let limitMax: number | null = null

    if (wantsPublish) {
      // Find owner. The action assumes the caller is updating their own offer.
      const { atLimit, max } = await isAtPublishedLimit(
        payload,
        Number(sessionUser.id),
        id,
      )
      if (atLimit) {
        savedAsDraftDueToLimit = true
        limitMax = max
        isDraft = true
        ;(data as any)._status = 'draft'
      }
    }

    const result = await payload.update({
      collection: 'offers',
      id,
      data: data as Offer,
      overrideAccess: true,
      draft: isDraft,
    })

    if (savedAsDraftDueToLimit) {
      return {
        success: true as const,
        data: result,
        savedAsDraftDueToLimit: true,
        message: `Limit ofert opublikowanych (${limitMax}) został osiągnięty — oferta została zapisana jako wersja robocza.`,
      }
    }

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[updateOffer]', err)
    return {
      success: false as const,
      error: describeSaveError(err, 'Nie udało się zaktualizować oferty'),
    }
  }
}
```

- [ ] **Step 4: Pre-check inside `toggleOfferStatus`**

Replace the body of `toggleOfferStatus` (lines 195-217) with:

```ts
export async function toggleOfferStatus(id: number, currentStatus: string) {
  try {
    const sessionUser = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const newStatus = currentStatus === 'published' ? 'draft' : 'published'

    if (newStatus === 'published') {
      const { atLimit, max } = await isAtPublishedLimit(
        payload,
        Number(sessionUser.id),
        id,
      )
      if (atLimit) {
        return {
          success: false as const,
          error: `Limit ofert opublikowanych (${max}) został osiągnięty. Aby opublikować tę ofertę, najpierw przenieś inną do wersji roboczej.`,
        }
      }
    }

    const result = await payload.update({
      collection: 'offers',
      id,
      data: { _status: newStatus } as Partial<Offer>,
      overrideAccess: true,
      draft: newStatus === 'draft',
    })

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[toggleOfferStatus]', err)
    return { success: false as const, error: 'Nie udało się zmienić statusu oferty' }
  }
}
```

- [ ] **Step 5: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. The new return shapes (with optional `savedAsDraftDueToLimit` + `message`) are additive — existing client code that only reads `result.success` and `result.data` still works.

- [ ] **Step 6: Commit**

```bash
git add src/actions/panel/offers.ts
git commit -m "feat(billing): pre-check publish-cap in createOffer/updateOffer/toggleOfferStatus"
```

---

## Task 9: Add cached plan-summary fetcher

**Files:**
- Create: `src/actions/stripe/products/getPlanPriceSummary.ts`

- [ ] **Step 1: Create the helper**

Create `src/actions/stripe/products/getPlanPriceSummary.ts`:

```ts
'use server'

import { unstable_cache } from 'next/cache'
import { getStripePrices, type StripePriceDetails } from './getStripePrices'

export interface PlanPriceSummary {
  monthly: { id: string; amount: number; currency: string } | null
  yearly: { id: string; amount: number; currency: string } | null
}

const cacheKey = 'stripe-plan-price-summary'
const cacheTTL = 60 * 60 // 1 hour

/**
 * Returns the cheapest 1-month and 1-year recurring price for a plan, used
 * by the wizard's plan-picker step to show subtle pricing strips. Cached
 * for 1h to avoid hitting Stripe on every page render. Returns nulls on
 * Stripe failure so the UI can show "Cena niedostępna".
 */
export async function getPlanPriceSummary(productId: string): Promise<PlanPriceSummary> {
  if (!productId) return { monthly: null, yearly: null }

  return unstable_cache(
    async (): Promise<PlanPriceSummary> => {
      try {
        const result = await getStripePrices(productId)
        if (!result.success) return { monthly: null, yearly: null }

        const monthly = pickCheapest(result.prices, 'month', 1)
        const yearly = pickCheapest(result.prices, 'year', 1)

        return {
          monthly: monthly
            ? { id: monthly.id, amount: monthly.unitAmount ?? 0, currency: monthly.currency }
            : null,
          yearly: yearly
            ? { id: yearly.id, amount: yearly.unitAmount ?? 0, currency: yearly.currency }
            : null,
        }
      } catch (err) {
        console.error(`[getPlanPriceSummary] failed for ${productId}`, err)
        return { monthly: null, yearly: null }
      }
    },
    [cacheKey, productId],
    { revalidate: cacheTTL, tags: [`${cacheKey}:${productId}`] },
  )()
}

function pickCheapest(
  prices: StripePriceDetails[],
  interval: 'month' | 'year',
  intervalCount: number,
): StripePriceDetails | null {
  const matching = prices
    .filter(
      (p) =>
        p.recurring?.interval === interval && p.recurring.intervalCount === intervalCount,
    )
    .sort((a, b) => (a.unitAmount ?? 0) - (b.unitAmount ?? 0))
  return matching[0] ?? null
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/stripe/products/getPlanPriceSummary.ts
git commit -m "feat(billing): add cached getPlanPriceSummary helper"
```

---

## Task 10: Build the new wizard cards (PlanModeCard + PlanPickerCard)

**Files:**
- Create: `src/components/panel/plan-subskrypcji/PlanModeCard.tsx`
- Create: `src/components/panel/plan-subskrypcji/PlanPickerCard.tsx`

- [ ] **Step 1: Create `PlanModeCard.tsx`**

Create `src/components/panel/plan-subskrypcji/PlanModeCard.tsx`:

```tsx
'use client'

import type { ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanModeCardProps {
  title: string
  description: string
  icon: ReactNode
  selected: boolean
  onSelect: () => void
}

export function PlanModeCard({ title, description, icon, selected, onSelect }: PlanModeCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:border-accent/60',
        selected && 'border-accent',
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="text-accent mt-1">{icon}</div>
          <div className="flex flex-col gap-1">
            <CardTitle className="font-bebas text-2xl tracking-wide">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter>
        <Button variant={selected ? 'default' : 'outline'} className="w-full" onClick={onSelect}>
          Wybierz
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 2: Create `PlanPickerCard.tsx`**

Create `src/components/panel/plan-subskrypcji/PlanPickerCard.tsx`:

```tsx
'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SubscriptionPlan } from '@/payload-types'
import type { PlanPriceSummary } from '@/actions/stripe/products/getPlanPriceSummary'

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

interface PlanPickerCardProps {
  plan: SubscriptionPlan
  priceSummary: PlanPriceSummary
  selected: boolean
  onSelect: () => void
}

export function PlanPickerCard({ plan, priceSummary, selected, onSelect }: PlanPickerCardProps) {
  const limit = plan.maxOffers ?? 1
  const limitLabel = `Do ${limit} ${limit === 1 ? 'oferty' : limit < 5 ? 'ofert' : 'ofert'}`

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:border-accent/60 flex flex-col',
        selected && 'border-accent',
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="font-bebas text-2xl tracking-wide">{plan.name}</CardTitle>
          <Badge variant="secondary">{limitLabel}</Badge>
        </div>
        {plan.description && <CardDescription>{plan.description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          {priceSummary.monthly ? (
            <span>{formatPrice(priceSummary.monthly.amount, priceSummary.monthly.currency)} / miesiąc</span>
          ) : (
            <span>Cena niedostępna</span>
          )}
          {priceSummary.yearly && (
            <span>{formatPrice(priceSummary.yearly.amount, priceSummary.yearly.currency)} / rok</span>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant={selected ? 'default' : 'outline'} className="w-full" onClick={onSelect}>
          Wybierz
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/panel/plan-subskrypcji/PlanModeCard.tsx src/components/panel/plan-subskrypcji/PlanPickerCard.tsx
git commit -m "feat(billing): add PlanModeCard + PlanPickerCard for new wizard steps"
```

---

## Task 11: Refactor `SubscriptionManager` for the new flow

**Files:**
- Modify: `src/components/panel/plan-subskrypcji/SubscriptionManager.tsx`
- Modify: `src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx`

This is the largest task in the plan. It rewires the wizard's state machine and adds the new mode/plan steps.

- [ ] **Step 1: Update `page.tsx` to fetch plan data + price summaries server-side**

Replace `src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx` with:

```tsx
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { getHeaderBackgroundUrl } from '@/actions/panel/getHeaderBackground'
import { getPlanPriceSummary, type PlanPriceSummary } from '@/actions/stripe/products/getPlanPriceSummary'
import { PanelPageHeader } from '@/components/panel/PanelPageHeader'
import { SubscriptionManager } from '@/components/panel/plan-subskrypcji/SubscriptionManager'
import { AdminDisclaimer } from '@/components/panel/AdminDisclaimer'
import type { SubscriptionPlan } from '@/payload-types'

export const metadata = { title: 'Plan subskrypcji' }

export default async function PlanSubskrypcjiPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect(`/${lang}/auth/sign-in`)
  }

  const payload = await getPayload({ config })
  const user = await payload.findByID({
    collection: 'users',
    id: Number(session.user.id),
    depth: 0,
  })

  if (!user) {
    redirect(`/${lang}/auth/sign-in`)
  }

  const [subscription, categoriesResult, bgUrl, multiPlansResult] = await Promise.all([
    getCurrentSubscriptionDetails(user.id),
    payload.find({
      collection: 'service-categories',
      depth: 2,
      sort: 'name',
      limit: 100,
    }),
    getHeaderBackgroundUrl(),
    payload.find({
      collection: 'subscription-plans',
      where: { maxOffers: { greater_than: 1 } },
      sort: 'level',
      limit: 10,
    }),
  ])

  const multiPlans = multiPlansResult.docs as SubscriptionPlan[]

  // Fetch price summaries for all multi-class plans in parallel
  const planSummaries: Record<string, PlanPriceSummary> = {}
  await Promise.all(
    multiPlans
      .filter((p) => p.stripeID)
      .map(async (p) => {
        planSummaries[p.id] = await getPlanPriceSummary(p.stripeID as string)
      }),
  )

  const betaMode = process.env.BETA_MODE === 'true'

  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader
        title="Plan subskrypcji"
        description="Zarządzaj swoim planem i kategorią usług"
        breadcrumbs={[{ label: 'Plan subskrypcji' }]}
        lang={lang}
        backgroundImageUrl={bgUrl}
      />
      <AdminDisclaimer role={user.role ?? ''} variant="subscription" />
      <SubscriptionManager
        user={user}
        subscription={subscription}
        categories={categoriesResult.docs as any}
        multiPlans={multiPlans}
        planSummaries={planSummaries}
        lang={lang}
        showBetaOption={betaMode}
      />
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `SubscriptionManager.tsx`**

This is a near-total rewrite of `src/components/panel/plan-subskrypcji/SubscriptionManager.tsx`. Replace the entire file with:

```tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  SettingsIcon,
  TagIcon,
  CheckIcon,
  SparklesIcon,
  UserIcon,
  Building2Icon,
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { CategoryPicker } from '@/components/panel/wizard/CategoryPicker'
import { PlanModeCard } from '@/components/panel/plan-subskrypcji/PlanModeCard'
import { PlanPickerCard } from '@/components/panel/plan-subskrypcji/PlanPickerCard'
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession'
import { activateBetaAccess } from '@/actions/stripe/activateBetaAccess'
import { createBillingPortalSession } from '@/actions/stripe/manageSubscription'
import { getStripePrices, type StripePriceDetails } from '@/actions/stripe/products/getStripePrices'
import type { PlanPriceSummary } from '@/actions/stripe/products/getPlanPriceSummary'
import { cn } from '@/lib/utils'
import type { User, SubscriptionPlan, ServiceCategory } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

const BETA_PRICE_ID = 'BETA'

type ManagerView =
  | 'status'
  | 'onboarding-mode'
  | 'onboarding-plan'
  | 'onboarding-category'
  | 'onboarding-price'

type Mode = 'single' | 'multi'

interface SubscriptionManagerProps {
  user: User
  subscription: CurrentSubscriptionDetails
  categories: ServiceCategory[]
  multiPlans: SubscriptionPlan[]
  planSummaries: Record<string, PlanPriceSummary>
  lang: string
  showBetaOption: boolean
}

function deriveInitialView(user: User): ManagerView {
  if (user.role === 'service-provider') return 'status'
  return 'onboarding-mode'
}

function getRequiredPlanFromCategory(
  categories: ServiceCategory[],
  categoryString: string,
): SubscriptionPlan | null {
  if (!categoryString) return null
  const parts = categoryString.split(' > ')
  let currentItems = categories
  let requiredPlan: SubscriptionPlan | null = null

  for (const part of parts) {
    const found = currentItems.find((c) => c.name === part) as any
    if (!found) break
    if (found.requiredPlan && typeof found.requiredPlan === 'object') {
      requiredPlan = found.requiredPlan as SubscriptionPlan
    }
    if (found.subcategory_level_1?.length) {
      currentItems = found.subcategory_level_1
    } else if (found.subcategory_level_2?.length) {
      currentItems = found.subcategory_level_2
    } else {
      break
    }
  }

  return requiredPlan
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

function getIntervalLabel(interval: string, intervalCount: number): string {
  if (interval === 'month' && intervalCount === 1) return 'Miesięcznie'
  if (interval === 'month' && intervalCount === 6) return 'Co 6 miesięcy'
  if (interval === 'year' && intervalCount === 1) return 'Rocznie'
  return `Co ${intervalCount} ${interval}`
}

function viewToStep(view: ManagerView): number {
  switch (view) {
    case 'onboarding-mode': return 1
    case 'onboarding-plan':
    case 'onboarding-category': return 2
    case 'onboarding-price': return 3
    default: return 1
  }
}

const TOTAL_STEPS = 3

export function SubscriptionManager({
  user,
  subscription,
  categories,
  multiPlans,
  planSummaries,
  lang,
  showBetaOption,
}: SubscriptionManagerProps) {
  const router = useRouter()
  const [view, setView] = React.useState<ManagerView>(() => deriveInitialView(user))
  const [mode, setMode] = React.useState<Mode | null>(null)
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null)
  const [selectedCategory, setSelectedCategory] = React.useState<string>(user.serviceCategory ?? '')
  const [selectedPriceId, setSelectedPriceId] = React.useState<string | null>(null)
  const [availablePrices, setAvailablePrices] = React.useState<StripePriceDetails[]>([])
  const [isPricesLoading, setIsPricesLoading] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const categoryNames = selectedCategory ? selectedCategory.split(' > ') : []
  const categorySlugs = selectedCategory
    ? selectedCategory.split(' > ').map((n) => n.toLowerCase().replace(/\s+/g, '-'))
    : []

  // Resolve the active plan + product depending on mode
  const activePlan: SubscriptionPlan | null =
    mode === 'multi' ? selectedPlan : getRequiredPlanFromCategory(categories, selectedCategory)
  const stripeProductId = activePlan?.stripeID ?? null

  // Fetch Stripe prices when arriving at the price step
  React.useEffect(() => {
    if (!stripeProductId || view !== 'onboarding-price') {
      setAvailablePrices([])
      setSelectedPriceId(null)
      return
    }

    let cancelled = false
    setIsPricesLoading(true)

    getStripePrices(stripeProductId).then((result) => {
      if (cancelled) return
      if (result.success) {
        const sorted = [...result.prices].sort((a, b) => {
          const aMonths = a.recurring?.interval === 'year' ? a.recurring.intervalCount * 12 : (a.recurring?.intervalCount ?? 1)
          const bMonths = b.recurring?.interval === 'year' ? b.recurring.intervalCount * 12 : (b.recurring?.intervalCount ?? 1)
          return aMonths - bMonths
        })
        setAvailablePrices(sorted)
        if (sorted.length === 1) setSelectedPriceId(sorted[0].id)
      } else {
        toast.error('Nie udało się pobrać dostępnych cen.')
      }
      setIsPricesLoading(false)
    })

    return () => { cancelled = true }
  }, [stripeProductId, view])

  const stepNumber = viewToStep(view)
  const isOnboarding = view !== 'status'
  const progressValue = (stepNumber / TOTAL_STEPS) * 100

  const stepHeading = (() => {
    switch (view) {
      case 'onboarding-mode': return 'Wybierz typ konta'
      case 'onboarding-plan': return 'Wybierz plan'
      case 'onboarding-category': return 'Wybierz kategorię'
      case 'onboarding-price': return 'Wybierz okres rozliczeniowy'
      default: return ''
    }
  })()

  function handleCheckout() {
    if (!selectedPriceId || !activePlan) return

    startTransition(async () => {
      try {
        if (selectedPriceId === BETA_PRICE_ID) {
          const result = await activateBetaAccess({
            userId: user.id,
            categoryNames,
            categorySlugs,
            maxOffers: activePlan.maxOffers ?? 1,
          })
          if (result.success) {
            toast.success('Dostęp beta został aktywowany!')
            window.location.href = `/${lang}/panel/dashboard?checkout=success`
          } else {
            toast.error(result.error ?? 'Nie udało się aktywować dostępu beta.')
          }
          return
        }

        const result = await createCheckoutSession({
          priceId: selectedPriceId,
          userId: user.id,
          successUrl: `/${lang}/panel/plan-subskrypcji?success=1`,
          cancelUrl: `/${lang}/panel/plan-subskrypcji`,
          categoryNames,
          categorySlugs,
          userEmail: user.email,
        })

        if (result.url) {
          router.push(result.url)
        } else {
          toast.error('Nie udało się utworzyć sesji płatności.')
        }
      } catch {
        toast.error('Wystąpił błąd podczas tworzenia sesji płatności.')
      }
    })
  }

  function handleRenew() {
    setMode(null)
    setSelectedPlan(null)
    setSelectedCategory(user.serviceCategory ?? '')
    setSelectedPriceId(null)
    setView('onboarding-mode')
  }

  // ============ ONBOARDING VIEWS ============
  if (isOnboarding) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Krok {stepNumber} z {TOTAL_STEPS}</span>
            <span>{stepHeading}</span>
          </div>
          <Progress value={progressValue} />
        </div>

        {view === 'onboarding-mode' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Ile ofert chcesz publikować?</h2>
              <p className="text-sm text-muted-foreground">
                Wybierz typ konta dopasowany do Twojej działalności.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PlanModeCard
                title="Jedno ogłoszenie wystarczy"
                description="Świadczę jedną główną usługę (np. tylko jako DJ albo tylko catering). Idealne, jeśli skupiasz się na jednej specjalizacji."
                icon={<UserIcon className="size-7" />}
                selected={mode === 'single'}
                onSelect={() => {
                  setMode('single')
                  setSelectedPlan(null)
                  setView('onboarding-category')
                }}
              />
              <PlanModeCard
                title="Więcej ofert"
                description="Świadczę kilka różnych usług (np. DJ + catering, fotograf + dekoracje). Najczęściej wybierane przez agencje i firmy oferujące wiele specjalizacji jednocześnie."
                icon={<Building2Icon className="size-7" />}
                selected={mode === 'multi'}
                onSelect={() => {
                  setMode('multi')
                  setSelectedCategory('')
                  setView('onboarding-plan')
                }}
              />
            </div>
          </div>
        )}

        {view === 'onboarding-plan' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz plan</h2>
              <p className="text-sm text-muted-foreground">
                Wszystkie kategorie usług są dostępne w obu planach.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {multiPlans.map((plan) => (
                <PlanPickerCard
                  key={plan.id}
                  plan={plan}
                  priceSummary={planSummaries[plan.id] ?? { monthly: null, yearly: null }}
                  selected={selectedPlan?.id === plan.id}
                  onSelect={() => {
                    setSelectedPlan(plan)
                    setView('onboarding-price')
                  }}
                />
              ))}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setView('onboarding-mode')}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                Wstecz
              </Button>
            </div>
          </div>
        )}

        {view === 'onboarding-category' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz swoją kategorię usług</h2>
              <p className="text-sm text-muted-foreground">
                Określ, jakiego rodzaju usługi świadczysz. Od wybranej kategorii zależy plan subskrypcji.
              </p>
            </div>

            <CategoryPicker
              categories={categories as any}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />

            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setView('onboarding-mode')}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                Wstecz
              </Button>
              <Button
                disabled={!selectedCategory || isPending}
                onClick={() => setView('onboarding-price')}
              >
                Dalej
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}

        {view === 'onboarding-price' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz okres rozliczeniowy</h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'single' && (
                  <>
                    Kategoria: <span className="font-medium text-foreground">{selectedCategory}</span>
                    {activePlan && (
                      <> — Plan: <span className="font-medium text-foreground">{activePlan.name}</span></>
                    )}
                  </>
                )}
                {mode === 'multi' && activePlan && (
                  <>
                    Plan: <span className="font-medium text-foreground">{activePlan.name}</span>
                    {' '}— do {activePlan.maxOffers ?? 1} ofert
                  </>
                )}
              </p>
            </div>

            {isPricesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-6" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {availablePrices.map((price) => {
                  const isSelected = selectedPriceId === price.id
                  const label = getIntervalLabel(
                    price.recurring?.interval ?? 'month',
                    price.recurring?.intervalCount ?? 1,
                  )
                  const formattedPrice = formatPrice(price.unitAmount ?? 0, price.currency)

                  return (
                    <button
                      key={price.id}
                      type="button"
                      onClick={() => setSelectedPriceId(price.id)}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/30',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex size-5 items-center justify-center rounded-full border',
                          isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/30',
                        )}>
                          {isSelected && <CheckIcon className="size-3" />}
                        </div>
                        <span className="font-medium">{label}</span>
                      </div>
                      <span className="font-bebas text-xl tracking-wide">{formattedPrice}</span>
                    </button>
                  )
                })}

                {showBetaOption && (
                  <button
                    type="button"
                    onClick={() => setSelectedPriceId(BETA_PRICE_ID)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border border-dashed px-4 py-3 text-left transition-colors',
                      selectedPriceId === BETA_PRICE_ID
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/30',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex size-5 items-center justify-center rounded-full border',
                        selectedPriceId === BETA_PRICE_ID ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/30',
                      )}>
                        {selectedPriceId === BETA_PRICE_ID && <CheckIcon className="size-3" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="size-4 text-accent" />
                        <span className="font-medium">Dostęp Beta</span>
                        <Badge variant="outline" className="text-accent border-accent/30">Za darmo</Badge>
                      </div>
                    </div>
                    <span className="font-bebas text-xl tracking-wide text-accent">0 PLN</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setView(mode === 'multi' ? 'onboarding-plan' : 'onboarding-category')}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                Wstecz
              </Button>

              <Button
                disabled={!selectedPriceId || isPending}
                onClick={handleCheckout}
              >
                {isPending && <Spinner data-icon="inline-start" />}
                {selectedPriceId === BETA_PRICE_ID ? 'Aktywuj dostęp beta' : 'Przejdź do płatności'}
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ STATUS VIEW ============
  const isExpired = user.role === 'service-provider' && !subscription.hasSubscription
  const isActive = user.role === 'service-provider' && subscription.hasSubscription
  const isMultiClass = (subscription.currentPlan?.maxOffers ?? 1) > 1

  return (
    <div className="flex flex-col gap-6">
      {isExpired && (
        <>
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>Subskrypcja wygasła</AlertTitle>
            <AlertDescription>
              Twoja subskrypcja wygasła. Twoje oferty zostały wycofane z publikacji.
            </AlertDescription>
          </Alert>

          <Button onClick={handleRenew} className="w-fit">
            <RefreshCwIcon data-icon="inline-start" />
            Odnów subskrypcję
          </Button>
        </>
      )}

      {isActive && (
        <Card className="bg-background border-border/20">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-bebas text-2xl tracking-wide">
                {subscription.isBetaUser
                  ? 'Plan Beta'
                  : (subscription.currentPlan?.name ?? 'Aktywna subskrypcja')}
              </CardTitle>
              <Badge variant={subscription.cancelAtPeriodEnd ? 'destructive' : 'secondary'}>
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Aktywna'}
              </Badge>
            </div>
            {user.serviceCategory && (
              <CardDescription>
                <span>Kategoria: {user.serviceCategory}</span>
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Odnowienie'}:{' '}
                <span className="font-medium text-foreground">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
            )}

            {subscription.cancelAtPeriodEnd && (
              <Alert>
                <AlertTriangleIcon />
                <AlertTitle>Subskrypcja zostanie anulowana</AlertTitle>
                <AlertDescription>
                  Twoja subskrypcja nie zostanie automatycznie odnowiona.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-3">
              {!isMultiClass && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setMode('single')
                    setSelectedCategory(user.serviceCategory ?? '')
                    setView('onboarding-category')
                  }}
                >
                  <TagIcon data-icon="inline-start" />
                  Zmień kategorię
                </Button>
              )}

              {!subscription.isBetaUser && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await createBillingPortalSession(user.id, window.location.href)
                      if (result.success && result.url) {
                        window.open(result.url, '_blank')
                      } else {
                        toast.error(result.message || 'Nie można otworzyć portalu rozliczeniowego.')
                      }
                    })
                  }}
                >
                  {isPending && <Spinner data-icon="inline-start" />}
                  <SettingsIcon data-icon="inline-start" />
                  Zarządzaj płatnościami
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. The earlier `activateBetaAccess` signature change is now satisfied by the call from `handleCheckout`.

- [ ] **Step 4: Smoke-test in dev**

Run: `pnpm dev` (in another terminal). Navigate to `/pl/panel/plan-subskrypcji` as a fresh client account. Verify:
- The mode picker renders with two cards.
- Picking "Jedno ogłoszenie wystarczy" → goes to category picker.
- Picking "Więcej ofert" → goes to plan picker showing Multi (and Agency once you've created them in Stripe; for now an empty list is OK).
- The "Wstecz" buttons return to the prior step.
- The progress bar shows 33% / 66% / 100%.

If the wizard breaks, fix and re-verify before committing.

- [ ] **Step 5: Lint**

Run: `pnpm lint -- src/components/panel/plan-subskrypcji src/app/\(frontend\)/\[lang\]/panel/plan-subskrypcji`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/panel/plan-subskrypcji/SubscriptionManager.tsx \
        'src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx'
git commit -m "feat(billing): branched subscription wizard with mode + plan picker steps"
```

---

## Task 12: Build the downgrade-drafted dashboard banner

**Files:**
- Create: `src/actions/panel/dismissDowngradeDraftedBanner.ts`
- Create: `src/components/panel/dashboard/DowngradeDraftedBanner.tsx`
- Modify: `src/app/(frontend)/[lang]/panel/dashboard/page.tsx`

- [ ] **Step 1: Create the dismiss server action**

Create `src/actions/panel/dismissDowngradeDraftedBanner.ts`:

```ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function dismissDowngradeDraftedBanner() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return { success: false as const, error: 'Brak autoryzacji' }
    }
    const payload = await getPayload({ config })
    await payload.update({
      collection: 'users',
      id: Number(session.user.id),
      data: { downgradedDraftedAt: null },
      overrideAccess: true,
    })
    revalidatePath('/pl/panel/dashboard')
    revalidatePath('/en/panel/dashboard')
    return { success: true as const }
  } catch (err) {
    console.error('[dismissDowngradeDraftedBanner]', err)
    return { success: false as const, error: 'Nie udało się ukryć powiadomienia' }
  }
}
```

- [ ] **Step 2: Create the banner component**

Create `src/components/panel/dashboard/DowngradeDraftedBanner.tsx`:

```tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangleIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { dismissDowngradeDraftedBanner } from '@/actions/panel/dismissDowngradeDraftedBanner'

export function DowngradeDraftedBanner({ lang }: { lang: string }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function handleDismiss() {
    startTransition(async () => {
      const result = await dismissDowngradeDraftedBanner()
      if (!result.success) {
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <Alert>
      <AlertTriangleIcon />
      <div className="flex flex-col gap-2 w-full">
        <AlertTitle>Twoja subskrypcja została obniżona</AlertTitle>
        <AlertDescription>
          Część Twoich ofert została automatycznie zapisana jako wersje robocze, aby zmieścić się
          w limicie nowego planu. Możesz je przejrzeć w sekcji „Oferty" i wybrać, które chcesz
          opublikować ponownie.
        </AlertDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/${lang}/panel/oferty`}>Przejdź do ofert</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={isPending}>
            <XIcon data-icon="inline-start" />
            Zamknij
          </Button>
        </div>
      </div>
    </Alert>
  )
}
```

- [ ] **Step 3: Render the banner on the dashboard**

In `src/app/(frontend)/[lang]/panel/dashboard/page.tsx`, add the import after the existing imports:

```ts
import { DowngradeDraftedBanner } from '@/components/panel/dashboard/DowngradeDraftedBanner'
```

In the JSX returned at the bottom of the page, immediately AFTER the `<AdminDisclaimer ... />` line and BEFORE the `{!stats.success ? ...}` block, add:

```tsx
{user.downgradedDraftedAt && <DowngradeDraftedBanner lang={lang} />}
```

- [ ] **Step 4: Type-check + smoke test**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

In dev (`pnpm dev`), set `downgradedDraftedAt` to a timestamp on your test user via Payload admin (`/app`), then refresh `/pl/panel/dashboard` — the banner should appear. Click "Zamknij" — banner should disappear and `downgradedDraftedAt` should be `null` in the DB.

- [ ] **Step 5: Commit**

```bash
git add src/actions/panel/dismissDowngradeDraftedBanner.ts \
        src/components/panel/dashboard/DowngradeDraftedBanner.tsx \
        'src/app/(frontend)/[lang]/panel/dashboard/page.tsx'
git commit -m "feat(billing): downgrade-drafted dashboard banner with dismiss action"
```

---

## Task 13: Final integration checks + lint pass

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole tree**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors. If there are unrelated pre-existing warnings/errors, leave them — this PR shouldn't fix unrelated lint debt.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: `payload migrate` runs cleanly (the new migration applies), then `next build` completes. The `/pl` SSG prerender that previously broke on missing columns now succeeds because the migration ran first.

If `next build` fails with "column does not exist", the migration didn't apply — re-check Task 3 step 3 (registration in `migrations/index.ts`).

- [ ] **Step 4: Smoke-test the wizard in dev**

Run: `pnpm dev`. As a fresh client account:
- Navigate to `/pl/panel/plan-subskrypcji`.
- Verify the mode picker is the first thing shown.
- Pick Single → category → interval → click "Przejdź do płatności" (use Stripe test card `4242 4242 4242 4242` if you've set up test products; otherwise just verify the redirect URL is correct).
- Repeat for Multi (if you've created Multi/Agency in Stripe test mode).
- Verify Beta works on both paths if `BETA_MODE=true`.

- [ ] **Step 5: Run the spec runbook in test mode**

Open the spec at [docs/superpowers/specs/2026-04-30-multi-agency-billing-design.md](../specs/2026-04-30-multi-agency-billing-design.md) and walk through "Manual checklist (post-merge runbook)" steps 1–10 in Stripe **test mode**. Tick off each box. Note any findings.

- [ ] **Step 6: Final commit (if anything came up)**

```bash
# Only if changes were needed during smoke test
git add -A
git commit -m "fix(billing): smoke-test fixes"
```

- [ ] **Step 7: Open PR**

If running interactively, create the PR manually. The PR description should:
- Link to the spec.
- Note that the runbook steps in Stripe Live mode (1–6) and the follow-up flip to `required: true` (step 13) are deferred to merge time.
- Call out the new webhook event subscription requirement (`customer.subscription.updated`, `product.created`, `product.updated`).

---

## Self-review: spec coverage map

| Spec section | Covered by |
|--------------|-----------|
| `subscription-plans.maxOffers` field | Task 1 |
| `users.downgradedDraftedAt` field | Task 2 |
| Manual Drizzle migration | Task 3 |
| `enforceMaxPublishedOffers` hook | Task 4 |
| Webhook handlers (`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`) | Task 5 |
| Empty-array `Array.isArray && length > 0` tightening | Task 5 (webhooks), Task 7 (updateSubscription) |
| Beta path writes plan's `maxOffers` | Task 6 |
| `updateSubscription.ts` updates | Task 7 |
| Pre-check publish-cap UX in `offers.ts` | Task 8 |
| Cached plan-summary fetch + Stripe-down fallback | Task 9 |
| `PlanModeCard` and `PlanPickerCard` components | Task 10 |
| Wizard state machine (mode → plan/category → interval) | Task 11 |
| Server-side plan summary fetch in page.tsx | Task 11 step 1 |
| Status view "Zmień kategorię" hide for Multi/Agency | Task 11 step 2 |
| `<CardDescription>` empty-render fix | Task 11 step 2 (conditional render moved up) |
| Mobile responsive `grid-cols-1 sm:grid-cols-2` | Task 11 step 2 (mode + plan grids) |
| Step counter formula | Task 11 step 2 (`viewToStep`) |
| Downgrade banner | Task 12 |
| Banner dismissal | Task 12 step 1 |
| `serviceProviderOnboarding` admin view | Out of scope per spec — not addressed in plan. Comment note can go in a follow-up. |
| Dashboard `atLimit` total-vs-published reconciliation | Out of scope per spec. Untouched. |

The `serviceProviderOnboarding/index.client.tsx` admin view is not in any task. It's flagged as out-of-scope for v1 in the spec; if reachable in your admin, the spec calls for a comment note. Add this as a one-line follow-up TODO in your post-merge backlog rather than blocking this plan.
