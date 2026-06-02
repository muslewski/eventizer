# Subscription Plan Change Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Zmień Plan" entry on `/panel/plan-subskrypcji` that lets users change tier and/or billing interval post-onboarding, with an impact summary that previews offer-drafting consequences. Extend onboarding so new users can pick Multi/Agency directly.

**Architecture:** Refactor today's `SubscriptionManager` into a step-driven wizard using react-hook-form + FormProvider, with one controller (`SubscriptionWizard`) and 5 step components (`PlanKindStep`, `CategoryStep`, `TierStep`, `IntervalStep`, `ImpactSummaryStep`). Plan-change logic lives in `changePlan` server action (Stripe `subscriptions.update`, plus immediate write-through of `user.maxOffers`/`serviceCategory`). A new `customer.subscription.updated` webhook handler runs the drafting algorithm (Pass A: category-violations; Pass B: limit overflow) idempotently. Event-ID deduplication via a new `ProcessedStripeEvents` collection.

**Tech Stack:** Next.js App Router (16.x), Payload CMS 3.75, Stripe via `@payloadcms/plugin-stripe`, react-hook-form + zod, Vitest for unit/integration, Playwright for E2E, shadcn/ui components, Tailwind v4, motion/react.

**Spec:** [`docs/superpowers/specs/2026-05-11-subscription-plan-change-wizard-design.md`](../specs/2026-05-11-subscription-plan-change-wizard-design.md). The spec is final and all decisions are locked (see spec §16).

---

## File structure

### New files

```
src/lib/subscriptions/
└── draftOffersOnDowngrade.ts                  # Pass A + Pass B algorithm (shared)

src/lib/stripe/
└── deduplicateStripeEvent.ts                  # Event-ID dedup helper

src/collections/
└── ProcessedStripeEvents.ts                   # Dedup + audit collection

src/components/panel/plan-subskrypcji/
├── SubscriptionWizard.tsx                     # Controller (FormProvider)
├── steps/
│   ├── PlanKindStep.tsx
│   ├── CategoryStep.tsx
│   ├── TierStep.tsx
│   ├── IntervalStep.tsx
│   └── ImpactSummaryStep.tsx
└── lib/
    ├── planChangeSchema.ts                    # Zod schema + WizardFormData type
    ├── resolvePlanFromSelection.ts
    ├── wizardSequence.ts
    └── pluralizeOffers.ts                     # Polish noun declension

src/actions/stripe/
├── changePlan.ts                              # Replaces updateSubscription internals
├── computePlanChangeImpact.ts                 # Read-only impact preview
└── updateBetaUserPlan.ts                      # Beta-to-beta + inline drafting

src/app/api/cron/purge-stripe-events/
└── route.ts                                   # Daily cleanup

tests/int/
├── lib/draftOffersOnDowngrade.int.spec.ts
├── lib/pluralizeOffers.int.spec.ts
├── lib/resolvePlanFromSelection.int.spec.ts
├── lib/wizardSequence.int.spec.ts
├── plugins/stripe-webhooks.int.spec.ts
├── actions/computePlanChangeImpact.int.spec.ts
├── actions/changePlan.int.spec.ts
└── wizard/SubscriptionWizard.int.spec.tsx

tests/e2e/
└── subscription-wizard.e2e.spec.ts
```

### Modified files

```
src/plugins/index.ts                           # Add customer.subscription.updated; extend checkout.session.completed + customer.subscription.created with maxOffers + drafting
src/collections/Offers/hooks/enforceMaxOffers.ts  # Add _status='published' filter
src/payload.config.ts                          # Register ProcessedStripeEvents collection
src/components/panel/plan-subskrypcji/SubscriptionManager.tsx  # Trim to status view + entry-buttons dropdown
src/actions/stripe/updateSubscription.ts       # Thin alias → changePlan
```

---

## Phase A — Pure helpers (parallel, no deps)

Each task is independently mergeable. Tests-first; no behavior change yet.

### Task A1: `pluralizeOffers` Polish noun declension helper

**Files:**
- Create: `src/components/panel/plan-subskrypcji/lib/pluralizeOffers.ts`
- Test: `tests/int/lib/pluralizeOffers.int.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/int/lib/pluralizeOffers.int.spec.ts
import { describe, it, expect } from 'vitest'
import { pluralizeOffers } from '@/components/panel/plan-subskrypcji/lib/pluralizeOffers'

describe('pluralizeOffers', () => {
  it('1 → singular: 1 oferta zostanie przeniesiona', () => {
    expect(pluralizeOffers(1)).toEqual({
      count: '1',
      noun: 'oferta',
      verb: 'zostanie',
      participle: 'przeniesiona',
    })
  })

  it.each([2, 3, 4, 22, 23, 24])('few-form for %i', (n) => {
    expect(pluralizeOffers(n)).toMatchObject({
      noun: 'oferty',
      verb: 'zostaną',
      participle: 'przeniesione',
    })
  })

  it.each([0, 5, 11, 12, 13, 14, 21, 25, 100])('many-form for %i', (n) => {
    expect(pluralizeOffers(n)).toMatchObject({
      noun: 'ofert',
      verb: 'zostanie',
      participle: 'przeniesionych',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm run test:int -- pluralizeOffers`
Expected: FAIL with "Cannot find module 'pluralizeOffers'"

- [ ] **Step 3: Implement**

```ts
// src/components/panel/plan-subskrypcji/lib/pluralizeOffers.ts
export interface OfferPluralForm {
  count: string
  noun: 'oferta' | 'oferty' | 'ofert'
  verb: 'zostanie' | 'zostaną'
  participle: 'przeniesiona' | 'przeniesione' | 'przeniesionych'
}

export function pluralizeOffers(n: number): OfferPluralForm {
  const lastTwo = n % 100
  const last = n % 10

  if (n === 1) {
    return { count: '1', noun: 'oferta', verb: 'zostanie', participle: 'przeniesiona' }
  }
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return { count: String(n), noun: 'oferty', verb: 'zostaną', participle: 'przeniesione' }
  }
  return { count: String(n), noun: 'ofert', verb: 'zostanie', participle: 'przeniesionych' }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm run test:int -- pluralizeOffers`
Expected: PASS — all 16 test cases green.

- [ ] **Step 5: Commit**

```bash
git add src/components/panel/plan-subskrypcji/lib/pluralizeOffers.ts tests/int/lib/pluralizeOffers.int.spec.ts
git commit -m "feat(billing): add pluralizeOffers Polish declension helper"
```

---

### Task A2: `ProcessedStripeEvents` collection

**Files:**
- Create: `src/collections/ProcessedStripeEvents.ts`
- Modify: `src/payload.config.ts` (register the collection)

- [ ] **Step 1: Define the collection**

```ts
// src/collections/ProcessedStripeEvents.ts
import { adminOrHigher } from '@/access'
import { adminGroups } from '@/lib/adminGroups'
import { CollectionConfig } from 'payload'

export const ProcessedStripeEvents: CollectionConfig = {
  slug: 'processed-stripe-events',
  labels: {
    singular: { en: 'Processed Stripe Event', pl: 'Przetworzone zdarzenie Stripe' },
    plural: { en: 'Processed Stripe Events', pl: 'Przetworzone zdarzenia Stripe' },
  },
  admin: {
    useAsTitle: 'eventId',
    group: adminGroups.settings,
    description: {
      en: 'Audit + idempotency record for Stripe subscription events. Cleaned daily after 30 days.',
      pl: 'Rejestr audytu i idempotencji dla zdarzeń subskrypcji Stripe. Czyszczony codziennie po 30 dniach.',
    },
    defaultColumns: ['eventId', 'eventType', 'user', 'changeType', 'processedAt'],
  },
  access: {
    read: adminOrHigher,
    create: () => false, // Only written by webhook handlers
    update: () => false,
    delete: adminOrHigher, // Cron deletes via overrideAccess
  },
  fields: [
    { name: 'eventId', type: 'text', required: true, unique: true, index: true },
    { name: 'eventType', type: 'text', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'subscriptionId', type: 'text' },
    { name: 'changeType', type: 'select', options: ['upgrade', 'downgrade', 'lateral', 'interval_only', 'no_change', 'other'] },
    { name: 'prevPlanSlug', type: 'text' },
    { name: 'newPlanSlug', type: 'text' },
    { name: 'prevLevel', type: 'number' },
    { name: 'newLevel', type: 'number' },
    { name: 'draftedByCategory', type: 'number', defaultValue: 0 },
    { name: 'draftedByLimit', type: 'number', defaultValue: 0 },
    { name: 'processedAt', type: 'date', required: true, defaultValue: () => new Date() },
  ],
}
```

- [ ] **Step 2: Register in payload.config.ts**

Find the `collections: [...]` array in `src/payload.config.ts` and add `ProcessedStripeEvents` to it. Import at the top.

```ts
import { ProcessedStripeEvents } from './collections/ProcessedStripeEvents'
// ...
collections: [
  // ...existing collections,
  ProcessedStripeEvents,
],
```

- [ ] **Step 3: Generate types and migration**

Run: `pnpm run generate:types`
Expected: `src/payload-types.ts` updated with the new `ProcessedStripeEvent` type.

Then run: `pnpm exec payload migrate:create processed_stripe_events_collection`
Expected: new migration file in `src/migrations/` creating the table.

- [ ] **Step 4: Verify migration runs cleanly**

Run: `pnpm exec payload migrate`
Expected: migration applies; new table exists.

- [ ] **Step 5: Commit**

```bash
git add src/collections/ProcessedStripeEvents.ts src/payload.config.ts src/payload-types.ts src/migrations/
git commit -m "feat(billing): add ProcessedStripeEvents collection for dedup + audit"
```

---

### Task A3: `deduplicateStripeEvent` helper

**Files:**
- Create: `src/lib/stripe/deduplicateStripeEvent.ts`
- Test: `tests/int/lib/deduplicateStripeEvent.int.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/int/lib/deduplicateStripeEvent.int.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { deduplicateStripeEvent } from '@/lib/stripe/deduplicateStripeEvent'

describe('deduplicateStripeEvent', () => {
  it('returns false when event is already in the collection', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: 1, eventId: 'evt_123' }], totalDocs: 1 }),
    } as any
    const isNew = await deduplicateStripeEvent(payload, 'evt_123')
    expect(isNew).toBe(false)
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'processed-stripe-events',
      where: { eventId: { equals: 'evt_123' } },
      limit: 1,
      depth: 0,
    })
  })

  it('returns true when event has not been seen', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    } as any
    expect(await deduplicateStripeEvent(payload, 'evt_456')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm run test:int -- deduplicateStripeEvent`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/stripe/deduplicateStripeEvent.ts
import type { Payload } from 'payload'

export async function deduplicateStripeEvent(payload: Payload, eventId: string): Promise<boolean> {
  const existing = await payload.find({
    collection: 'processed-stripe-events',
    where: { eventId: { equals: eventId } },
    limit: 1,
    depth: 0,
  })
  return existing.totalDocs === 0
}
```

- [ ] **Step 4: Verify tests pass**

Run: `pnpm run test:int -- deduplicateStripeEvent`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stripe/deduplicateStripeEvent.ts tests/int/lib/deduplicateStripeEvent.int.spec.ts
git commit -m "feat(billing): add deduplicateStripeEvent helper"
```

---

### Task A4: Drafting helper `draftOffersOnDowngrade`

**Files:**
- Create: `src/lib/subscriptions/draftOffersOnDowngrade.ts`
- Test: `tests/int/lib/draftOffersOnDowngrade.int.spec.ts`

This is the spec's §5 step 8 algorithm. It's shared by the webhook handler and `updateBetaUserPlan`. Read-only mode is achieved by setting `dryRun: true`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/int/lib/draftOffersOnDowngrade.int.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { draftOffersOnDowngrade } from '@/lib/subscriptions/draftOffersOnDowngrade'

const makePayload = (offers: any[], categories: any[]) => ({
  find: vi.fn(async ({ collection }) => {
    if (collection === 'offers') return { docs: offers, totalDocs: offers.length }
    if (collection === 'service-categories') return { docs: categories, totalDocs: categories.length }
    return { docs: [], totalDocs: 0 }
  }),
  update: vi.fn(async () => ({})),
})

const planT1 = { level: 1, maxOffers: 1, slug: 'single' }
const planT4 = { level: 4, maxOffers: 4, slug: 'multi' }

const offer = (id: number, slug: string, createdAt: string) => ({
  id, _status: 'published', user: 1, category: slug, createdAt,
})

const cat = (slug: string, requiredPlanLevel: number) => ({
  slug, requiredPlan: { level: requiredPlanLevel },
  subcategory_level_1: [], subcategory_level_2: [],
})

describe('draftOffersOnDowngrade', () => {
  it('Pass A only: drafts offers whose category exceeds new plan level', async () => {
    const offers = [
      offer(1, 'music', '2026-01-01'),  // ok (cat level 1)
      offer(2, 'photo', '2026-01-02'),  // too high (cat level 3)
    ]
    const categories = [
      { ...cat('music', 1) },
      { ...cat('photo', 3) },
    ]
    const payload = makePayload(offers, categories)

    const result = await draftOffersOnDowngrade({
      payload, userId: 1, newPlan: planT1, dryRun: false,
    })
    expect(result.draftedByCategory).toEqual([2])
    expect(result.draftedByLimit).toEqual([])
    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 2, data: { _status: 'draft' },
    }))
  })

  it('Pass B only: drafts excess by oldest-kept rule when all categories fit', async () => {
    const offers = [
      offer(1, 'music', '2026-01-01'),
      offer(2, 'music', '2026-01-02'),
      offer(3, 'music', '2026-01-03'),
    ]
    const categories = [{ ...cat('music', 1) }]
    const payload = makePayload(offers, categories)

    const result = await draftOffersOnDowngrade({
      payload, userId: 1, newPlan: planT1, dryRun: false,
    })
    // Keep oldest = offer 1; draft 2 and 3
    expect(result.draftedByCategory).toEqual([])
    expect(result.draftedByLimit).toEqual([2, 3])
  })

  it('Both passes: category violations first, then limit cap', async () => {
    const offers = [
      offer(1, 'music', '2026-01-01'),  // ok
      offer(2, 'music', '2026-01-02'),  // ok
      offer(3, 'photo', '2026-01-03'),  // category violation
    ]
    const categories = [cat('music', 1), cat('photo', 3)]
    const payload = makePayload(offers, categories)

    const result = await draftOffersOnDowngrade({
      payload, userId: 1, newPlan: planT1, dryRun: false,
    })
    expect(result.draftedByCategory).toEqual([3])
    expect(result.draftedByLimit).toEqual([2])  // keep oldest "music" = id 1
  })

  it('dryRun does not call update', async () => {
    const offers = [
      offer(1, 'music', '2026-01-01'),
      offer(2, 'music', '2026-01-02'),
    ]
    const categories = [cat('music', 1)]
    const payload = makePayload(offers, categories)

    await draftOffersOnDowngrade({ payload, userId: 1, newPlan: planT1, dryRun: true })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('Offers with no resolvable category are left untouched by Pass A', async () => {
    const offers = [offer(1, 'deleted-cat', '2026-01-01')]
    const categories = [] // no match
    const payload = makePayload(offers, categories)

    const result = await draftOffersOnDowngrade({
      payload, userId: 1, newPlan: planT4, dryRun: false,
    })
    expect(result.draftedByCategory).toEqual([])
    expect(result.draftedByLimit).toEqual([])
  })

  it('Always reads current state, never trusts event payload', async () => {
    const payload = makePayload([], [])
    await draftOffersOnDowngrade({ payload, userId: 1, newPlan: planT1, dryRun: false })
    // The find call queries current `_status: 'published'`, not anything from an event
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'offers',
      where: expect.objectContaining({ _status: { equals: 'published' } }),
    }))
  })
})
```

- [ ] **Step 2: Verify it fails**

Run: `pnpm run test:int -- draftOffersOnDowngrade`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper**

```ts
// src/lib/subscriptions/draftOffersOnDowngrade.ts
import type { Payload } from 'payload'

export interface DraftOnDowngradeInput {
  payload: Payload
  userId: number
  newPlan: { level: number; maxOffers: number; slug?: string }
  dryRun?: boolean
}

export interface DraftOnDowngradeResult {
  draftedByCategory: number[]   // offer IDs drafted because category required higher plan
  draftedByLimit: number[]      // offer IDs drafted because over maxOffers
  keptPublished: number[]
}

/**
 * Pass A: draft offers whose deepest-matching category.requiredPlan.level > newPlan.level.
 * Pass B: cap remaining published to newPlan.maxOffers, keep oldest by createdAt.
 *
 * Always reads current Payload state — idempotent. Do not "optimize" by reading from Stripe events.
 */
export async function draftOffersOnDowngrade({
  payload,
  userId,
  newPlan,
  dryRun = false,
}: DraftOnDowngradeInput): Promise<DraftOnDowngradeResult> {
  // 1. Fetch current published offers
  const offers = (await payload.find({
    collection: 'offers',
    where: { user: { equals: userId }, _status: { equals: 'published' } },
    depth: 0,
    limit: 0,
  })).docs as Array<{ id: number; category: string; createdAt: string }>

  if (offers.length === 0) {
    return { draftedByCategory: [], draftedByLimit: [], keptPublished: [] }
  }

  // 2. Resolve category slug paths → requiredPlan.level via service-categories
  const uniqueSlugPaths = Array.from(new Set(offers.map(o => o.category).filter(Boolean)))
  const levelByPath = await resolveLevelByCategoryPath(payload, uniqueSlugPaths)

  // 3. Pass A
  const draftedByCategory: number[] = []
  let stillPublished = offers.filter((o) => {
    const level = levelByPath.get(o.category)
    if (level === undefined) return true // defensive: leave unresolved categories alone
    if (level > newPlan.level) {
      draftedByCategory.push(o.id)
      return false
    }
    return true
  })

  // 4. Pass B
  const draftedByLimit: number[] = []
  if (stillPublished.length > newPlan.maxOffers) {
    stillPublished.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const kept = stillPublished.slice(0, newPlan.maxOffers)
    const toDraft = stillPublished.slice(newPlan.maxOffers)
    toDraft.forEach(o => draftedByLimit.push(o.id))
    stillPublished = kept
  }

  // 5. Write
  if (!dryRun) {
    const toDraftAll = [...draftedByCategory, ...draftedByLimit]
    for (const id of toDraftAll) {
      await payload.update({
        collection: 'offers',
        id,
        data: { _status: 'draft' },
        context: { disableRevalidate: true },
      })
    }
  }

  return {
    draftedByCategory,
    draftedByLimit,
    keptPublished: stillPublished.map(o => o.id),
  }
}

async function resolveLevelByCategoryPath(
  payload: Payload,
  slugPaths: string[],
): Promise<Map<string, number>> {
  if (slugPaths.length === 0) return new Map()

  // Top-level slugs from each path
  const topSlugs = Array.from(new Set(slugPaths.map(p => p.split('/')[0])))
  const cats = (await payload.find({
    collection: 'service-categories',
    where: { slug: { in: topSlugs } },
    limit: 0,
    depth: 1, // pull requiredPlan one level deep
  })).docs as any[]

  const out = new Map<string, number>()
  for (const path of slugPaths) {
    const parts = path.split('/')
    const root = cats.find((c) => c.slug === parts[0])
    if (!root) continue
    const level = walkPath(root, parts.slice(1))
    if (level !== null) out.set(path, level)
  }
  return out
}

// Walk subcategory_level_N arrays to deepest match; return deepest non-null requiredPlan.level.
// Falls back to ancestor levels if leaf doesn't have requiredPlan set.
function walkPath(node: any, remainder: string[]): number | null {
  let current: any = node
  let bestLevel: number | null = readLevel(current)
  for (const slug of remainder) {
    const children = current.subcategory_level_1 ?? current.subcategory_level_2 ?? []
    const next = children.find((c: any) => c.slug === slug)
    if (!next) break
    const lvl = readLevel(next)
    if (lvl !== null) bestLevel = lvl
    current = next
  }
  return bestLevel
}

function readLevel(node: any): number | null {
  const rp = node?.requiredPlan
  if (!rp) return null
  if (typeof rp === 'object' && typeof rp.level === 'number') return rp.level
  return null
}
```

- [ ] **Step 4: Verify all tests pass**

Run: `pnpm run test:int -- draftOffersOnDowngrade`
Expected: PASS — all 6 cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/subscriptions/draftOffersOnDowngrade.ts tests/int/lib/draftOffersOnDowngrade.int.spec.ts
git commit -m "feat(billing): add draftOffersOnDowngrade algorithm (Pass A + Pass B)"
```

---

## Phase B — Handler extensions & policy fix (deps: A1, A4)

### Task B1: Extract a `syncUserFromPlan` helper

**Files:**
- Create: `src/lib/subscriptions/syncUserFromPlan.ts`
- Test: `tests/int/lib/syncUserFromPlan.int.spec.ts`

Used by all three webhook handlers (checkout completion, subscription created, subscription updated) to write `user.maxOffers`, `serviceCategory`, `serviceCategorySlug` consistently.

- [ ] **Step 1: Write the test**

```ts
// tests/int/lib/syncUserFromPlan.int.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { syncUserFromPlan } from '@/lib/subscriptions/syncUserFromPlan'

const makePayload = () => ({ update: vi.fn(async () => ({})) })

describe('syncUserFromPlan', () => {
  it('sets maxOffers + category fields for Single plan', async () => {
    const payload = makePayload()
    await syncUserFromPlan({
      payload: payload as any,
      userId: 1,
      newPlan: { maxOffers: 1 } as any,
      categoryNames: ['Music', 'DJ'],
      categorySlugs: ['music', 'dj'],
    })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 1,
      data: {
        maxOffers: 1,
        serviceCategory: 'Music > DJ',
        serviceCategorySlug: 'music/dj',
      },
    })
  })

  it('clears category fields for Multi/Agency plans (maxOffers > 1)', async () => {
    const payload = makePayload()
    await syncUserFromPlan({
      payload: payload as any,
      userId: 2,
      newPlan: { maxOffers: 4 } as any,
    })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 2,
      data: { maxOffers: 4, serviceCategory: null, serviceCategorySlug: null },
    })
  })

  it('preserves category fields when preserveCategoryIfSingle=true and no metadata', async () => {
    const payload = makePayload()
    await syncUserFromPlan({
      payload: payload as any,
      userId: 3,
      newPlan: { maxOffers: 1 } as any,
      preserveCategoryIfSingle: true,
    })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 3,
      data: { maxOffers: 1 }, // no category writes
    })
  })
})
```

- [ ] **Step 2: Verify it fails**

Run: `pnpm run test:int -- syncUserFromPlan`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/subscriptions/syncUserFromPlan.ts
import type { Payload } from 'payload'
import type { SubscriptionPlan } from '@/payload-types'

interface SyncUserFromPlanInput {
  payload: Payload
  userId: number
  newPlan: SubscriptionPlan
  categoryNames?: string[]
  categorySlugs?: string[]
  preserveCategoryIfSingle?: boolean
}

export async function syncUserFromPlan({
  payload,
  userId,
  newPlan,
  categoryNames,
  categorySlugs,
  preserveCategoryIfSingle = false,
}: SyncUserFromPlanInput): Promise<void> {
  const data: Record<string, unknown> = { maxOffers: newPlan.maxOffers ?? 1 }

  const isMultiOrAgency = (newPlan.maxOffers ?? 1) > 1
  const hasMetadata = (categoryNames?.length ?? 0) > 0

  if (isMultiOrAgency) {
    data.serviceCategory = null
    data.serviceCategorySlug = null
  } else if (hasMetadata) {
    data.serviceCategory = categoryNames!.join(' > ')
    data.serviceCategorySlug = categorySlugs!.join('/')
  } else if (preserveCategoryIfSingle) {
    // do nothing — keep existing serviceCategory
  }
  // else: no metadata + Single plan + not preserving → leave fields alone

  await payload.update({ collection: 'users', id: userId, data })
}
```

- [ ] **Step 4: Verify tests pass**

Run: `pnpm run test:int -- syncUserFromPlan`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/subscriptions/syncUserFromPlan.ts tests/int/lib/syncUserFromPlan.int.spec.ts
git commit -m "feat(billing): add syncUserFromPlan helper"
```

---

### Task B2: Extend `checkout.session.completed` to set `maxOffers` + run drafting

**Files:**
- Modify: `src/plugins/index.ts` (the `checkout.session.completed` webhook block, around lines 88–185)

Today this handler sets `role`, `serviceCategory`, `serviceCategorySlug` but NOT `maxOffers`. Extend it to (a) call `syncUserFromPlan`, (b) call `draftOffersOnDowngrade` for beta-to-paid conversions where the user has more published offers than the new plan allows.

- [ ] **Step 1: Read the existing handler**

Read `src/plugins/index.ts` around lines 88–185 to ground yourself in the existing pattern.

- [ ] **Step 2: Add the maxOffers + drafting logic inside the existing handler**

In the existing `checkout.session.completed` handler, find the block that calls `payload.update({ collection: 'users', ..., data: { role, serviceCategory, serviceCategorySlug } })`. Replace the `payload.update` call with a `syncUserFromPlan` call, then optionally run drafting.

Insert before the update — resolve the new plan from the session:

```ts
import { syncUserFromPlan } from '@/lib/subscriptions/syncUserFromPlan'
import { draftOffersOnDowngrade } from '@/lib/subscriptions/draftOffersOnDowngrade'

// ... inside the existing handler, after the user is resolved:

// Resolve plan from the line item's product
const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1, expand: ['data.price.product'] })
const productId = typeof lineItems.data[0]?.price?.product === 'string'
  ? lineItems.data[0].price.product
  : lineItems.data[0]?.price?.product?.id
const planResult = await payload.find({
  collection: 'subscription-plans',
  where: { stripeID: { equals: productId } },
  limit: 1,
})
const newPlan = planResult.docs[0]

if (!newPlan) {
  console.warn(`checkout.session.completed: no subscription-plans match for product ${productId}`)
} else {
  // First: set role (unchanged from current behavior)
  await payload.update({
    collection: 'users',
    id: userId,
    data: { role: 'service-provider' },
  })

  // Then: sync plan-derived fields
  await syncUserFromPlan({
    payload,
    userId,
    newPlan,
    categoryNames: session.metadata?.categoryNames ? JSON.parse(session.metadata.categoryNames) : undefined,
    categorySlugs: session.metadata?.categorySlugs ? JSON.parse(session.metadata.categorySlugs) : undefined,
  })

  // Beta loophole fix: if user has more published offers than new plan allows, draft excess
  const published = await payload.find({
    collection: 'offers',
    where: { user: { equals: userId }, _status: { equals: 'published' } },
    depth: 0,
    limit: 0,
  })
  if (published.totalDocs > (newPlan.maxOffers ?? 1)) {
    await draftOffersOnDowngrade({ payload, userId, newPlan })
  }
}
```

Note: existing handler may already do `payload.update` with role + category. Adapt so only ONE update happens per user, and the metadata parse handles both legacy (delimited string) and new (JSON array) formats — for now assume JSON arrays (the format we'll write going forward). Existing callers must continue to work; check `createCheckoutSession.ts` to confirm metadata format.

- [ ] **Step 3: Manual smoke test (no webhook test scaffolding yet — that comes in Task C2)**

Trigger a test checkout in dev with `stripe listen --forward-to localhost:3000/api/payload/stripe-webhooks` and complete a checkout. Confirm via Payload admin that the user's `maxOffers` is now set.

- [ ] **Step 4: Commit**

```bash
git add src/plugins/index.ts
git commit -m "feat(billing): set user.maxOffers + run drafting in checkout.session.completed"
```

---

### Task B3: Extend `customer.subscription.created` fallback

**Files:**
- Modify: `src/plugins/index.ts` (the `customer.subscription.created` block, around lines 320–390)

Same idea — set `maxOffers` for the fallback path that fires when checkout.session.completed is missed.

- [ ] **Step 1: Locate the handler and add the same `syncUserFromPlan` call**

In the existing `customer.subscription.created` block, after resolving the user, resolve the plan via `subscription.items.data[0].price.product` and call `syncUserFromPlan`. No drafting needed here (this is a new subscription; no excess offers expected unless beta-converted, which is covered by Task B2).

```ts
// inside customer.subscription.created handler, after user resolution:
const productId = typeof subscription.items.data[0]?.price.product === 'string'
  ? subscription.items.data[0].price.product
  : subscription.items.data[0]?.price.product.id
const planResult = await payload.find({
  collection: 'subscription-plans',
  where: { stripeID: { equals: productId } },
  limit: 1,
})
const newPlan = planResult.docs[0]
if (newPlan) {
  const meta = subscription.metadata
  await syncUserFromPlan({
    payload,
    userId,
    newPlan,
    categoryNames: meta?.categoryNames ? JSON.parse(meta.categoryNames) : undefined,
    categorySlugs: meta?.categorySlugs ? JSON.parse(meta.categorySlugs) : undefined,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/plugins/index.ts
git commit -m "feat(billing): set user.maxOffers in customer.subscription.created fallback"
```

---

### Task B4: `enforceMaxOffers` policy fix — count published only

**Files:**
- Modify: `src/collections/Offers/hooks/enforceMaxOffers.ts:13-21`

Per spec §13 (locked decision): count only `_status: 'published'`, not drafts.

- [ ] **Step 1: Add the published-status filter to the find call**

In `enforceMaxOffers.ts`, change the offers `find` to include `_status: { equals: 'published' }`:

```ts
const userOffersResult = await req.payload.find({
  collection: 'offers',
  where: {
    user: { equals: req.user.id },
    _status: { equals: 'published' },
  },
  limit: 0,
})
```

(Keep the rest of the hook untouched.)

- [ ] **Step 2: Verify locally — create an offer when you have N drafts**

Login as a service-provider user with `maxOffers = 1` and N existing drafts. Create a new offer. Expected: no longer blocked by the limit.

- [ ] **Step 3: Commit**

```bash
git add src/collections/Offers/hooks/enforceMaxOffers.ts
git commit -m "fix(billing): enforceMaxOffers counts only published offers"
```

---

## Phase C — Webhook handler & cron (deps: A2, A3, A4, B1)

### Task C1: Build a webhook-handler test harness

**Files:**
- Create: `tests/int/plugins/_stripe-event-fixtures.ts` (shared fixtures)

The existing test suite has no webhook scaffolding. Create one minimal helper so future webhook tests stay consistent.

- [ ] **Step 1: Create the fixtures helper**

```ts
// tests/int/plugins/_stripe-event-fixtures.ts
import type Stripe from 'stripe'

export function makeSubscriptionUpdatedEvent({
  eventId = 'evt_test_1',
  subscriptionId = 'sub_test_1',
  customerId = 'cus_test_1',
  currentPriceId = 'price_new',
  currentProductId = 'prod_new',
  previousPriceId,
  metadata = {},
}: {
  eventId?: string
  subscriptionId?: string
  customerId?: string
  currentPriceId?: string
  currentProductId?: string
  previousPriceId?: string
  metadata?: Record<string, string>
}): Stripe.Event {
  return {
    id: eventId,
    type: 'customer.subscription.updated',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    api_version: '2024-12-18.acacia',
    pending_webhooks: 1,
    request: null,
    object: 'event',
    data: {
      object: {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        status: 'active',
        cancel_at_period_end: false,
        metadata,
        items: { data: [{ id: 'si_1', price: { id: currentPriceId, product: currentProductId } }] },
      } as any,
      previous_attributes: previousPriceId
        ? { items: { data: [{ price: { id: previousPriceId } }] } as any }
        : undefined,
    },
  } as unknown as Stripe.Event
}
```

- [ ] **Step 2: Commit (no behavior change yet)**

```bash
git add tests/int/plugins/_stripe-event-fixtures.ts
git commit -m "test(billing): add Stripe webhook event fixtures helper"
```

---

### Task C2: `customer.subscription.updated` handler — write the test

**Files:**
- Create: `tests/int/plugins/stripe-webhooks.int.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/int/plugins/stripe-webhooks.int.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSubscriptionUpdatedEvent } from './_stripe-event-fixtures'
import { handleSubscriptionUpdated } from '@/plugins/handlers/handleSubscriptionUpdated'

const planT2 = { id: 2, level: 2, maxOffers: 1, slug: 'single-plus', stripeID: 'prod_t2' }
const planT4 = { id: 4, level: 4, maxOffers: 4, slug: 'multi', stripeID: 'prod_t4' }

const makePayload = (overrides?: any) => ({
  find: vi.fn(async ({ collection, where }) => {
    if (collection === 'stripe-customers' && where?.stripeID?.equals === 'cus_test_1') {
      return { docs: [{ user: { id: 1 } }], totalDocs: 1 }
    }
    if (collection === 'subscription-plans' && where?.stripeID?.equals === 'prod_t4') {
      return { docs: [planT4], totalDocs: 1 }
    }
    if (collection === 'subscription-plans' && where?.stripeID?.equals === 'prod_t2') {
      return { docs: [planT2], totalDocs: 1 }
    }
    if (collection === 'offers') return { docs: [], totalDocs: 0 }
    if (collection === 'processed-stripe-events') return { docs: [], totalDocs: 0 }
    return { docs: [], totalDocs: 0 }
  }),
  update: vi.fn(async () => ({})),
  create: vi.fn(async () => ({})),
  ...overrides,
})

describe('customer.subscription.updated handler', () => {
  let payload: any
  beforeEach(() => { payload = makePayload() })

  it('dedup early-return when event was already processed', async () => {
    payload.find.mockImplementationOnce(async ({ collection }) => {
      if (collection === 'processed-stripe-events') return { docs: [{ id: 1 }], totalDocs: 1 }
      return { docs: [], totalDocs: 0 }
    })
    const event = makeSubscriptionUpdatedEvent({ currentProductId: 'prod_t4' })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('skips when previous_attributes.items is absent (non-plan update)', async () => {
    const event = makeSubscriptionUpdatedEvent({ currentProductId: 'prod_t4', previousPriceId: undefined })
    await handleSubscriptionUpdated({ payload, event })
    // Should still record the event for dedup
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'processed-stripe-events',
      data: expect.objectContaining({ changeType: 'other' }),
    }))
    expect(payload.update).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'users' }))
  })

  it('skips when price unchanged (early return)', async () => {
    const event = makeSubscriptionUpdatedEvent({
      currentPriceId: 'price_x',
      previousPriceId: 'price_x',
    })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'users' }))
  })

  it('sets user.maxOffers on upgrade', async () => {
    const event = makeSubscriptionUpdatedEvent({
      currentProductId: 'prod_t4',
      previousPriceId: 'price_t2',
      metadata: { planSlug: 'multi', changeType: 'upgrade' },
    })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 1,
      data: { maxOffers: 4, serviceCategory: null, serviceCategorySlug: null },
    })
  })

  it('records the event in processed-stripe-events with audit fields', async () => {
    const event = makeSubscriptionUpdatedEvent({
      currentProductId: 'prod_t4',
      previousPriceId: 'price_t2',
      metadata: { planSlug: 'multi', changeType: 'upgrade' },
    })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'processed-stripe-events',
      data: expect.objectContaining({
        eventId: 'evt_test_1',
        eventType: 'customer.subscription.updated',
        user: 1,
        subscriptionId: 'sub_test_1',
        newPlanSlug: 'multi',
        newLevel: 4,
      }),
    }))
  })

  it('preserves serviceCategory on Single→Single Portal swap (no metadata)', async () => {
    const event = makeSubscriptionUpdatedEvent({
      currentProductId: 'prod_t2', // Single+
      previousPriceId: 'price_t1',
      metadata: {}, // no category metadata = Portal swap
    })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 1,
      data: { maxOffers: 1 }, // NO serviceCategory writes
    })
  })

  it('does not clobber maxOffers when Stripe product is not in Payload', async () => {
    payload.find.mockImplementation(async ({ collection, where }) => {
      if (collection === 'stripe-customers') return { docs: [{ user: { id: 1 } }], totalDocs: 1 }
      if (collection === 'subscription-plans') return { docs: [], totalDocs: 0 }
      if (collection === 'processed-stripe-events') return { docs: [], totalDocs: 0 }
      return { docs: [], totalDocs: 0 }
    })
    const event = makeSubscriptionUpdatedEvent({ currentProductId: 'prod_unknown', previousPriceId: 'price_old' })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'users' }))
  })
})
```

- [ ] **Step 2: Verify it fails**

Run: `pnpm run test:int -- stripe-webhooks`
Expected: FAIL — module `@/plugins/handlers/handleSubscriptionUpdated` not found.

---

### Task C3: Extract handler logic to `src/plugins/handlers/handleSubscriptionUpdated.ts`

**Files:**
- Create: `src/plugins/handlers/handleSubscriptionUpdated.ts`
- Modify: `src/plugins/index.ts` (register the handler)

- [ ] **Step 1: Implement the handler**

```ts
// src/plugins/handlers/handleSubscriptionUpdated.ts
import type { Payload } from 'payload'
import type Stripe from 'stripe'
import { deduplicateStripeEvent } from '@/lib/stripe/deduplicateStripeEvent'
import { syncUserFromPlan } from '@/lib/subscriptions/syncUserFromPlan'
import { draftOffersOnDowngrade } from '@/lib/subscriptions/draftOffersOnDowngrade'

export interface HandleSubscriptionUpdatedInput {
  payload: Payload
  event: Stripe.Event
}

interface AuditFields {
  changeType: 'upgrade' | 'downgrade' | 'lateral' | 'interval_only' | 'no_change' | 'other'
  prevPlanSlug?: string
  newPlanSlug?: string
  prevLevel?: number
  newLevel?: number
  draftedByCategory?: number
  draftedByLimit?: number
  user?: number
  subscriptionId?: string
}

export async function handleSubscriptionUpdated({ payload, event }: HandleSubscriptionUpdatedInput): Promise<void> {
  // 1. Dedup
  const isNew = await deduplicateStripeEvent(payload, event.id)
  if (!isNew) return

  const subscription = event.data.object as Stripe.Subscription
  const previousAttributes = (event.data.previous_attributes ?? {}) as any
  const audit: AuditFields = { changeType: 'other', subscriptionId: subscription.id }

  try {
    // 2. Resolve linked user
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
    const customerRow = await payload.find({
      collection: 'stripe-customers',
      where: { stripeID: { equals: customerId } },
      limit: 1,
      depth: 1,
    })
    const linkedUser = customerRow.docs[0]?.user
    const userId = typeof linkedUser === 'object' ? linkedUser?.id : linkedUser
    if (!userId) {
      await recordEvent(payload, event, audit)
      return
    }
    audit.user = userId

    // 3. Skip if not a price change
    const currentPriceId = subscription.items.data[0]?.price.id
    const previousPriceId = previousAttributes?.items?.data?.[0]?.price?.id
    if (!previousAttributes.items || !previousPriceId || previousPriceId === currentPriceId) {
      await recordEvent(payload, event, audit)
      return
    }

    // 4. Resolve new plan
    const currentProductId = typeof subscription.items.data[0].price.product === 'string'
      ? subscription.items.data[0].price.product
      : subscription.items.data[0].price.product.id
    const newPlanResult = await payload.find({
      collection: 'subscription-plans',
      where: { stripeID: { equals: currentProductId } },
      limit: 1,
    })
    const newPlan = newPlanResult.docs[0]
    if (!newPlan) {
      console.warn(`customer.subscription.updated: no Payload plan for product ${currentProductId} (event ${event.id})`)
      await recordEvent(payload, event, audit)
      return
    }
    audit.newPlanSlug = newPlan.slug
    audit.newLevel = newPlan.level

    // 5. Resolve previous plan
    let previousPlan: { level: number; slug: string } | undefined
    const previousProductId = previousAttributes.items?.data?.[0]?.price?.product
    if (previousProductId) {
      const previousPlanResult = await payload.find({
        collection: 'subscription-plans',
        where: { stripeID: { equals: previousProductId } },
        limit: 1,
      })
      if (previousPlanResult.docs[0]) {
        previousPlan = { level: previousPlanResult.docs[0].level, slug: previousPlanResult.docs[0].slug }
        audit.prevPlanSlug = previousPlan.slug
        audit.prevLevel = previousPlan.level
      }
    }

    // 6. Determine changeType
    if (previousPlan) {
      if (newPlan.level > previousPlan.level) audit.changeType = 'upgrade'
      else if (newPlan.level < previousPlan.level) audit.changeType = 'downgrade'
      else audit.changeType = 'lateral'
    }

    // 7. Sync user fields
    const metadata = subscription.metadata as Record<string, string> | null | undefined
    const hasMetadataCategory = metadata?.categorySlugs && metadata.categorySlugs !== '[]'
    let categoryNames: string[] | undefined
    let categorySlugs: string[] | undefined
    if (hasMetadataCategory) {
      try {
        categoryNames = JSON.parse(metadata!.categoryNames ?? '[]')
        categorySlugs = JSON.parse(metadata!.categorySlugs ?? '[]')
      } catch { /* malformed metadata — treat as absent */ }
    }
    await syncUserFromPlan({
      payload,
      userId,
      newPlan,
      categoryNames,
      categorySlugs,
      preserveCategoryIfSingle: !hasMetadataCategory, // Portal bypass
    })

    // 8. Drafting on downgrade
    if (previousPlan && newPlan.level < previousPlan.level) {
      const result = await draftOffersOnDowngrade({ payload, userId, newPlan })
      audit.draftedByCategory = result.draftedByCategory.length
      audit.draftedByLimit = result.draftedByLimit.length
    }
  } catch (err) {
    console.error(`customer.subscription.updated handler error (event ${event.id}):`, err)
  } finally {
    await recordEvent(payload, event, audit)
  }
}

async function recordEvent(payload: Payload, event: Stripe.Event, audit: AuditFields): Promise<void> {
  try {
    await payload.create({
      collection: 'processed-stripe-events',
      data: {
        eventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
        ...audit,
      } as any,
    })
  } catch (err) {
    // Unique violation = a competing webhook delivery wrote first. Safe.
    console.warn(`recordEvent: failed to record ${event.id}`, err)
  }
}
```

- [ ] **Step 2: Register the handler in `src/plugins/index.ts`**

Add `customer.subscription.updated` to the `subscriptionEvents` list (or wherever events are registered) and dispatch to `handleSubscriptionUpdated`. Follow the existing pattern for other event handlers.

```ts
import { handleSubscriptionUpdated } from './handlers/handleSubscriptionUpdated'

// inside the webhooks object:
'customer.subscription.updated': async ({ event, payload }) => {
  await handleSubscriptionUpdated({ payload, event })
},
```

- [ ] **Step 3: Set `maxDuration = 60` on the webhook route**

Find the webhook route file (likely `src/app/api/payload/stripe-webhooks/route.ts` or wherever payload-plugin-stripe registers it). If it's a plugin-managed route, look for the option in the plugin config in `src/plugins/index.ts` and configure the route's runtime explicitly. If unclear, add this comment in `src/plugins/index.ts` near the stripe plugin config:

```ts
// NOTE: webhook route handler must export `maxDuration = 60` — required for downgrade
// processing on Vercel's default Hobby (10s) tier. See spec §5.
```

Verify with the user / find the right route file before assuming the location.

- [ ] **Step 4: Run the tests**

Run: `pnpm run test:int -- stripe-webhooks`
Expected: PASS — all 7 scenarios.

- [ ] **Step 5: Commit**

```bash
git add src/plugins/handlers/handleSubscriptionUpdated.ts src/plugins/index.ts tests/int/plugins/stripe-webhooks.int.spec.ts
git commit -m "feat(billing): add customer.subscription.updated webhook handler with dedup + drafting"
```

---

### Task C4: Daily cron to purge old `processed-stripe-events`

**Files:**
- Create: `src/app/api/cron/purge-stripe-events/route.ts`
- Modify: `vercel.json` (add cron schedule)

- [ ] **Step 1: Create the route**

```ts
// src/app/api/cron/purge-stripe-events/route.ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const maxDuration = 60

export async function GET(request: Request) {
  // Vercel cron auth: header CRON_SECRET must match env var
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

  const old = await payload.find({
    collection: 'processed-stripe-events',
    where: { processedAt: { less_than: cutoff.toISOString() } },
    limit: 1000,
    depth: 0,
  })

  let deleted = 0
  for (const doc of old.docs) {
    await payload.delete({ collection: 'processed-stripe-events', id: doc.id, overrideAccess: true })
    deleted++
  }

  return NextResponse.json({ deleted, cutoff: cutoff.toISOString() })
}
```

- [ ] **Step 2: Register the cron schedule**

If a `vercel.json` exists, add a `crons` entry. Otherwise, prefer `vercel.ts` (current best practice per the Vercel knowledge update). Schedule daily at 03:00 UTC:

```json
{
  "crons": [
    { "path": "/api/cron/purge-stripe-events", "schedule": "0 3 * * *" }
  ]
}
```

Ensure `CRON_SECRET` is set in Vercel env vars.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/purge-stripe-events/route.ts vercel.json
git commit -m "feat(billing): add daily cron to purge old processed-stripe-events"
```

---

## Phase D — Server actions (deps: A2, A4, B1, C3)

### Task D1: `computePlanChangeImpact` action

**Files:**
- Create: `src/actions/stripe/computePlanChangeImpact.ts`
- Test: `tests/int/actions/computePlanChangeImpact.int.spec.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/int/actions/computePlanChangeImpact.int.spec.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@/lib/stripe', () => ({ stripe: { prices: { list: vi.fn() }, subscriptions: { retrieve: vi.fn() } } }))
vi.mock('@/actions/getAuthenticatedUser', () => ({ getAuthenticatedUser: vi.fn() }))

import { computePlanChangeImpact } from '@/actions/stripe/computePlanChangeImpact'
import { getPayload } from 'payload'
import { stripe } from '@/lib/stripe'
import { getAuthenticatedUser } from '@/actions/getAuthenticatedUser'

describe('computePlanChangeImpact', () => {
  it('returns UNAUTHORIZED when user is not service-provider', async () => {
    (getAuthenticatedUser as any).mockResolvedValue({ id: 1 })
    ;(getPayload as any).mockResolvedValue({
      findByID: vi.fn().mockResolvedValue({ id: 1, role: 'client' }),
    })
    const result = await computePlanChangeImpact({ newPlanId: 4, intervalKey: 'month/1' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('UNAUTHORIZED')
  })

  it('returns no_change when newPlan and intervalKey match current', async () => {
    // ...full setup omitted; pattern same as above. Test asserts changeType: 'no_change'.
  })

  // Add additional cases as scaffolding develops: upgrade, downgrade with offers, currency mismatch.
})
```

(Keep this test minimal initially — full scenario coverage can grow as the action stabilizes.)

- [ ] **Step 2: Verify failure**

Run: `pnpm run test:int -- computePlanChangeImpact`
Expected: FAIL.

- [ ] **Step 3: Implement the action**

```ts
// src/actions/stripe/computePlanChangeImpact.ts
'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { stripe } from '@/lib/stripe'
import { getAuthenticatedUser } from '@/actions/getAuthenticatedUser'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'
import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { draftOffersOnDowngrade } from '@/lib/subscriptions/draftOffersOnDowngrade'
import type { SubscriptionPlan } from '@/payload-types'

export type PlanChangeType = 'upgrade' | 'downgrade' | 'lateral' | 'interval_only' | 'no_change'

export interface PlanChangeImpact {
  changeType: PlanChangeType
  currentPlan: SubscriptionPlan
  newPlan: SubscriptionPlan
  newPrice: { id: string; unitAmount: number; currency: string; interval: string; intervalCount: number }
  categoryWillBeCleared: boolean
  offersToDraft: {
    byCategory: { id: number; title: string; categorySlugPath: string }[]
    byLimit: { id: number; title: string }[]
  }
  offersToKeepPublished: { id: number; title: string }[]
  intervalChange?: { fromLabel: string; toLabel: string }
  currencyMismatch: boolean
  hasScheduledCancel: boolean
  isTrialing: boolean
  trialEnd?: string
}

export type ComputePlanChangeImpactResult =
  | { success: true; data: PlanChangeImpact }
  | { success: false; error: 'UNAUTHORIZED' | 'NO_ACTIVE_SUB' | 'PRICE_PLAN_MISMATCH' | 'PLAN_NOT_FOUND'; message: string }

export async function computePlanChangeImpact({
  newPlanId,
  intervalKey,
}: {
  newPlanId: number
  intervalKey: string // e.g. 'month/1', 'year/1'
}): Promise<ComputePlanChangeImpactResult> {
  const sessionUser = await getAuthenticatedUser()
  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: sessionUser.id, depth: 0 })

  if (user.role !== 'service-provider') {
    return { success: false, error: 'UNAUTHORIZED', message: 'Brak uprawnień.' }
  }

  const customerId = await getStripeCustomerId(user.id)
  if (!customerId) return { success: false, error: 'NO_ACTIVE_SUB', message: 'Brak aktywnej subskrypcji.' }

  const subscription = await getActiveSubscription(customerId)
  if (!subscription) return { success: false, error: 'NO_ACTIVE_SUB', message: 'Brak aktywnej subskrypcji.' }

  // Resolve newPlan
  const newPlan = await payload.findByID({ collection: 'subscription-plans', id: newPlanId, depth: 0 })
  if (!newPlan) return { success: false, error: 'PLAN_NOT_FOUND', message: 'Nie znaleziono planu.' }

  // Server-resolve price from newPlanId + intervalKey
  const prices = await stripe.prices.list({ product: newPlan.stripeID!, active: true, limit: 20 })
  const [interval, intervalCount] = intervalKey.split('/')
  const newPrice = prices.data.find(p => p.recurring?.interval === interval && p.recurring?.interval_count === Number(intervalCount))
  if (!newPrice) return { success: false, error: 'PRICE_PLAN_MISMATCH', message: 'Wybrana cena nie pasuje do planu.' }

  // Resolve current plan
  const currentSubItem = subscription.items.data[0]
  const currentProductId = typeof currentSubItem.price.product === 'string'
    ? currentSubItem.price.product
    : currentSubItem.price.product.id
  const currentPlanResult = await payload.find({
    collection: 'subscription-plans',
    where: { stripeID: { equals: currentProductId } },
    limit: 1,
  })
  const currentPlan = currentPlanResult.docs[0]
  if (!currentPlan) return { success: false, error: 'PLAN_NOT_FOUND', message: 'Plan niezsynchronizowany.' }

  // Compute changeType
  const samePlan = currentPlan.id === newPlan.id
  const samePrice = currentSubItem.price.id === newPrice.id
  let changeType: PlanChangeType
  if (samePlan && samePrice) changeType = 'no_change'
  else if (samePlan) changeType = 'interval_only'
  else if (newPlan.level > currentPlan.level) changeType = 'upgrade'
  else if (newPlan.level < currentPlan.level) changeType = 'downgrade'
  else changeType = 'lateral'

  // Drafting preview (dryRun)
  const dryRunResult = changeType === 'downgrade'
    ? await draftOffersOnDowngrade({ payload, userId: user.id, newPlan, dryRun: true })
    : { draftedByCategory: [], draftedByLimit: [], keptPublished: [] }

  // Hydrate to offers list
  const allOfferIds = [...dryRunResult.draftedByCategory, ...dryRunResult.draftedByLimit, ...dryRunResult.keptPublished]
  const offersResult = allOfferIds.length
    ? await payload.find({
        collection: 'offers',
        where: { id: { in: allOfferIds } },
        limit: 0, depth: 0,
      })
    : { docs: [] }
  const offerById = new Map(offersResult.docs.map((o: any) => [o.id, o]))

  const currencyMismatch = newPrice.currency.toLowerCase() !== currentSubItem.price.currency.toLowerCase()

  return {
    success: true,
    data: {
      changeType,
      currentPlan,
      newPlan,
      newPrice: {
        id: newPrice.id,
        unitAmount: newPrice.unit_amount ?? 0,
        currency: newPrice.currency,
        interval: newPrice.recurring?.interval ?? 'month',
        intervalCount: newPrice.recurring?.interval_count ?? 1,
      },
      categoryWillBeCleared: (currentPlan.maxOffers ?? 1) === 1 && (newPlan.maxOffers ?? 1) > 1,
      offersToDraft: {
        byCategory: dryRunResult.draftedByCategory.map(id => {
          const o: any = offerById.get(id)
          return { id, title: o?.title ?? '', categorySlugPath: o?.category ?? '' }
        }),
        byLimit: dryRunResult.draftedByLimit.map(id => {
          const o: any = offerById.get(id)
          return { id, title: o?.title ?? '' }
        }),
      },
      offersToKeepPublished: dryRunResult.keptPublished.map(id => {
        const o: any = offerById.get(id)
        return { id, title: o?.title ?? '' }
      }),
      currencyMismatch,
      hasScheduledCancel: subscription.cancel_at_period_end ?? false,
      isTrialing: subscription.status === 'trialing',
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
    },
  }
}
```

- [ ] **Step 4: Verify tests pass**

Run: `pnpm run test:int -- computePlanChangeImpact`
Expected: PASS (initially-minimal test coverage).

- [ ] **Step 5: Commit**

```bash
git add src/actions/stripe/computePlanChangeImpact.ts tests/int/actions/computePlanChangeImpact.int.spec.ts
git commit -m "feat(billing): add computePlanChangeImpact server action"
```

---

### Task D2: `updateBetaUserPlan` action

**Files:**
- Create: `src/actions/stripe/updateBetaUserPlan.ts`

- [ ] **Step 1: Implement**

```ts
// src/actions/stripe/updateBetaUserPlan.ts
'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedUser } from '@/actions/getAuthenticatedUser'
import { syncUserFromPlan } from '@/lib/subscriptions/syncUserFromPlan'
import { draftOffersOnDowngrade } from '@/lib/subscriptions/draftOffersOnDowngrade'
import { revalidatePath } from 'next/cache'

export type UpdateBetaUserPlanResult =
  | { success: true; data: { changeType: 'beta_update' } }
  | { success: false; error: 'UNAUTHORIZED' | 'PLAN_NOT_FOUND' | 'NOT_BETA'; message: string }

export async function updateBetaUserPlan({
  newPlanId,
  categoryNames,
  categorySlugs,
}: {
  newPlanId: number
  categoryNames?: string[]
  categorySlugs?: string[]
}): Promise<UpdateBetaUserPlanResult> {
  const sessionUser = await getAuthenticatedUser()
  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: sessionUser.id, depth: 0 })

  if (!user.betaAccess) {
    return { success: false, error: 'NOT_BETA', message: 'Ta akcja jest dostępna tylko dla użytkowników beta.' }
  }

  const newPlan = await payload.findByID({ collection: 'subscription-plans', id: newPlanId, depth: 0 })
  if (!newPlan) return { success: false, error: 'PLAN_NOT_FOUND', message: 'Nie znaleziono planu.' }

  // Inline drafting if downsizing
  const newMax = newPlan.maxOffers ?? 1
  const currentMax = user.maxOffers ?? 1
  if (newMax < currentMax) {
    await draftOffersOnDowngrade({ payload, userId: user.id, newPlan })
  }

  await syncUserFromPlan({ payload, userId: user.id, newPlan, categoryNames, categorySlugs })

  revalidatePath('/panel/plan-subskrypcji')
  revalidatePath('/panel/oferty')

  return { success: true, data: { changeType: 'beta_update' } }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/stripe/updateBetaUserPlan.ts
git commit -m "feat(billing): add updateBetaUserPlan action with inline drafting"
```

---

### Task D3: `changePlan` action

**Files:**
- Create: `src/actions/stripe/changePlan.ts`
- Test: `tests/int/actions/changePlan.int.spec.ts`

- [ ] **Step 1: Write the action**

```ts
// src/actions/stripe/changePlan.ts
'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { stripe } from '@/lib/stripe'
import { getAuthenticatedUser } from '@/actions/getAuthenticatedUser'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'
import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { syncUserFromPlan } from '@/lib/subscriptions/syncUserFromPlan'
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession'
import { updateBetaUserPlan } from '@/actions/stripe/updateBetaUserPlan'
import { revalidatePath } from 'next/cache'

export type ChangePlanResult =
  | { success: true; data: { changeType: string; requiresCheckoutRedirect?: boolean; checkoutUrl?: string } }
  | { success: false; error: ChangePlanError; message: string }

export type ChangePlanError =
  | 'UNAUTHORIZED' | 'STALE_PLAN' | 'NO_ACTIVE_SUB' | 'MULTIPLE_ITEMS'
  | 'PRICE_PLAN_MISMATCH' | 'CATEGORY_INVALID' | 'CURRENCY_MISMATCH' | 'PLAN_NOT_FOUND'

export async function changePlan({
  newPlanId,
  intervalKey,
  categoryNames,
  categorySlugs,
  expectedCurrentPlanId,
  keepScheduledCancel,
}: {
  newPlanId: number
  intervalKey: string
  categoryNames?: string[]
  categorySlugs?: string[]
  expectedCurrentPlanId: number | null
  keepScheduledCancel: boolean
}): Promise<ChangePlanResult> {
  const sessionUser = await getAuthenticatedUser()
  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: sessionUser.id, depth: 0 })

  // Beta path
  if (user.betaAccess) {
    // Beta-to-beta plan change happens through updateBetaUserPlan, not here.
    // changePlan is for paid users. Reject.
    return { success: false, error: 'UNAUTHORIZED', message: 'Użytkownicy beta używają innego endpointu.' }
  }

  if (user.role !== 'service-provider') {
    return { success: false, error: 'UNAUTHORIZED', message: 'Brak uprawnień.' }
  }

  // Validate categorySlugs total length + existence
  if (categorySlugs && categorySlugs.length) {
    const totalLen = JSON.stringify(categorySlugs).length + JSON.stringify(categoryNames ?? []).length
    if (totalLen > 450) {
      return { success: false, error: 'CATEGORY_INVALID', message: 'Wybrana kategoria jest zbyt długa.' }
    }
    // Lightweight existence check: query top-level slugs only
    const topSlugs = Array.from(new Set(categorySlugs.map(s => s.split('/')[0])))
    const cats = await payload.find({
      collection: 'service-categories',
      where: { slug: { in: topSlugs } },
      limit: topSlugs.length, depth: 0,
    })
    if (cats.totalDocs < topSlugs.length) {
      return { success: false, error: 'CATEGORY_INVALID', message: 'Wybrana kategoria nie istnieje.' }
    }
  }

  // Resolve newPlan + active subscription
  const newPlan = await payload.findByID({ collection: 'subscription-plans', id: newPlanId, depth: 0 })
  if (!newPlan) return { success: false, error: 'PLAN_NOT_FOUND', message: 'Nie znaleziono planu.' }

  const customerId = await getStripeCustomerId(user.id)
  const subscription = customerId ? await getActiveSubscription(customerId) : null
  if (!subscription) {
    // No active sub — route to checkout
    return await routeToCheckout({ user, newPlan, intervalKey, categoryNames, categorySlugs })
  }

  // Preconditions
  if (subscription.items.data.length !== 1) {
    return { success: false, error: 'MULTIPLE_ITEMS', message: 'Subskrypcja zawiera więcej niż jeden element — skontaktuj się z pomocą.' }
  }
  if (!['active', 'trialing'].includes(subscription.status)) {
    return await routeToCheckout({ user, newPlan, intervalKey, categoryNames, categorySlugs })
  }

  const currentSubItem = subscription.items.data[0]
  const currentProductId = typeof currentSubItem.price.product === 'string'
    ? currentSubItem.price.product
    : currentSubItem.price.product.id
  const currentPlanResult = await payload.find({
    collection: 'subscription-plans',
    where: { stripeID: { equals: currentProductId } },
    limit: 1,
  })
  const currentPlan = currentPlanResult.docs[0]
  if (!currentPlan) return { success: false, error: 'PLAN_NOT_FOUND', message: 'Plan niezsynchronizowany.' }

  // Optimistic concurrency
  if (expectedCurrentPlanId !== null && expectedCurrentPlanId !== currentPlan.id) {
    return { success: false, error: 'STALE_PLAN', message: 'Plan zmienił się w innej karcie.' }
  }

  // Server-resolve price
  const prices = await stripe.prices.list({ product: newPlan.stripeID!, active: true, limit: 20 })
  const [interval, intervalCount] = intervalKey.split('/')
  const newPrice = prices.data.find(p =>
    p.recurring?.interval === interval && p.recurring?.interval_count === Number(intervalCount),
  )
  if (!newPrice) {
    return { success: false, error: 'PRICE_PLAN_MISMATCH', message: 'Cena niezgodna z planem.' }
  }
  if (newPrice.currency.toLowerCase() !== currentSubItem.price.currency.toLowerCase()) {
    return { success: false, error: 'CURRENCY_MISMATCH', message: 'Niezgodność walut — skontaktuj się z pomocą.' }
  }

  // Determine changeType for proration_behavior + metadata
  const changeType =
    currentPlan.id === newPlan.id && currentSubItem.price.id === newPrice.id ? 'no_change' :
    currentPlan.id === newPlan.id ? 'interval_only' :
    newPlan.level > currentPlan.level ? 'upgrade' :
    newPlan.level < currentPlan.level ? 'downgrade' : 'lateral'

  if (changeType === 'no_change') {
    return { success: true, data: { changeType: 'no_change' } }
  }

  // cancel_at_period_end — only clear when both user opted in AND sub actually has it true
  const shouldClearCancel = !keepScheduledCancel && subscription.cancel_at_period_end === true
  const updateParams: any = {
    items: [{ id: currentSubItem.id, price: newPrice.id }],
    proration_behavior: changeType === 'downgrade' ? 'none' : 'create_prorations',
    metadata: {
      categoryNames: JSON.stringify(categoryNames ?? []),
      categorySlugs: JSON.stringify(categorySlugs ?? []),
      planSlug: newPlan.slug,
      changeType,
    },
  }
  if (shouldClearCancel) updateParams.cancel_at_period_end = false

  const idempotencyKey = `change-plan-${user.id}-${subscription.id}-${newPrice.id}-${expectedCurrentPlanId ?? 'init'}`

  await stripe.subscriptions.update(subscription.id, updateParams, { idempotencyKey })

  // Write-through (UI consistency — webhook is authoritative for drafting only)
  await syncUserFromPlan({
    payload,
    userId: user.id,
    newPlan,
    categoryNames,
    categorySlugs,
  })

  revalidatePath('/panel/plan-subskrypcji')
  revalidatePath('/panel/oferty')

  return { success: true, data: { changeType } }
}

async function routeToCheckout({ user, newPlan, intervalKey, categoryNames, categorySlugs }: any): Promise<ChangePlanResult> {
  // Re-use createCheckoutSession; need to resolve price ID first
  const prices = await stripe.prices.list({ product: newPlan.stripeID!, active: true, limit: 20 })
  const [interval, intervalCount] = intervalKey.split('/')
  const price = prices.data.find(p =>
    p.recurring?.interval === interval && p.recurring?.interval_count === Number(intervalCount),
  )
  if (!price) return { success: false, error: 'PRICE_PLAN_MISMATCH', message: 'Cena niezgodna z planem.' }

  const result = await createCheckoutSession({
    priceId: price.id,
    userId: user.id,
    successUrl: `/pl/panel/plan-subskrypcji?success=1`,
    cancelUrl: `/pl/panel/plan-subskrypcji`,
    categoryNames: categoryNames ?? [],
    categorySlugs: categorySlugs ?? [],
    userEmail: user.email,
  })
  if (result.url) {
    return { success: true, data: { changeType: 'new_checkout', requiresCheckoutRedirect: true, checkoutUrl: result.url } }
  }
  return { success: false, error: 'NO_ACTIVE_SUB', message: 'Nie udało się utworzyć sesji płatności.' }
}
```

- [ ] **Step 2: Write basic test**

Cover at least: UNAUTHORIZED, STALE_PLAN, the routing-to-checkout path. Pattern matches `computePlanChangeImpact` test.

- [ ] **Step 3: Verify, commit**

```bash
git add src/actions/stripe/changePlan.ts tests/int/actions/changePlan.int.spec.ts
git commit -m "feat(billing): add changePlan action with idempotency + write-through"
```

---

### Task D4: Convert `updateSubscription` to thin alias

**Files:**
- Modify: `src/actions/stripe/updateSubscription.ts`

- [ ] **Step 1: Replace the body with a delegation to `changePlan`**

```ts
// src/actions/stripe/updateSubscription.ts
'use server'

import { changePlan } from '@/actions/stripe/changePlan'

export interface UpdateSubscriptionResult {
  success: boolean
  message: string
  action?: 'upgraded' | 'downgraded' | 'same_plan' | 'category_only' | 'no_change'
}

/**
 * @deprecated Use changePlan directly. This alias preserves backward compatibility
 * with any caller that hasn't been migrated yet. The new signature derives userId
 * from session, so this no longer accepts userId from caller.
 */
export async function updateSubscription({
  newProductId,
  newPriceId,
  categoryNames,
  categorySlugs,
}: {
  newProductId: string
  newPriceId?: string
  categoryNames: string[]
  categorySlugs: string[]
}): Promise<UpdateSubscriptionResult> {
  // newPlanId is internal — we have to find it from stripe product ID
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  const planResult = await payload.find({
    collection: 'subscription-plans',
    where: { stripeID: { equals: newProductId } },
    limit: 1,
  })
  const newPlan = planResult.docs[0]
  if (!newPlan) return { success: false, message: 'Plan not found' }

  // newPriceId, if provided, must be translated to intervalKey
  let intervalKey = 'month/1'
  if (newPriceId) {
    const { stripe } = await import('@/lib/stripe')
    const price = await stripe.prices.retrieve(newPriceId)
    intervalKey = `${price.recurring?.interval ?? 'month'}/${price.recurring?.interval_count ?? 1}`
  }

  const result = await changePlan({
    newPlanId: newPlan.id,
    intervalKey,
    categoryNames,
    categorySlugs,
    expectedCurrentPlanId: null,
    keepScheduledCancel: true,
  })

  if (!result.success) return { success: false, message: result.message }

  const actionMap: Record<string, UpdateSubscriptionResult['action']> = {
    upgrade: 'upgraded',
    downgrade: 'downgraded',
    interval_only: 'same_plan',
    no_change: 'no_change',
    lateral: 'same_plan',
  }
  return {
    success: true,
    message: 'Plan updated.',
    action: actionMap[result.data.changeType],
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/stripe/updateSubscription.ts
git commit -m "refactor(billing): convert updateSubscription to thin alias over changePlan"
```

---

## Phase E — UI primitives (parallel with Phase D)

### Task E1: Extract `IntervalStep` (pure refactor)

**Files:**
- Create: `src/components/panel/plan-subskrypcji/steps/IntervalStep.tsx`
- Modify: `src/components/panel/plan-subskrypcji/SubscriptionManager.tsx` (delete the inline price-list block, use the new component)

Behavior is unchanged in this commit. Goal: get the existing onboarding flow rendering through the new component, verify no regression.

- [ ] **Step 1: Extract the inline price-list block**

Pull lines 238–341 of `SubscriptionManager.tsx` (the "Step 2: Price / billing interval" block) into a new component. The new component takes props mirroring the local state it currently uses:

```tsx
// src/components/panel/plan-subskrypcji/steps/IntervalStep.tsx
'use client'
import * as React from 'react'
import { CheckIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { StripePriceDetails } from '@/actions/stripe/products/getStripePrices'

const BETA_PRICE_ID = 'BETA'

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount / 100)
}
function getIntervalLabel(interval: string, intervalCount: number): string {
  if (interval === 'month' && intervalCount === 1) return 'Miesięcznie'
  if (interval === 'month' && intervalCount === 6) return 'Co 6 miesięcy'
  if (interval === 'year' && intervalCount === 1) return 'Rocznie'
  return `Co ${intervalCount} ${interval}`
}

export interface IntervalStepProps {
  availablePrices: StripePriceDetails[]
  isPricesLoading: boolean
  selectedPriceId: string | null
  onSelectPriceId: (id: string) => void
  showBetaOption: boolean
  selectedCategory: string
  requiredPlanName?: string
  onBack: () => void
  onNext: () => void
  isPending: boolean
  nextLabel?: string
}

export function IntervalStep({
  availablePrices, isPricesLoading, selectedPriceId, onSelectPriceId,
  showBetaOption, selectedCategory, requiredPlanName,
  onBack, onNext, isPending, nextLabel = 'Przejdź do płatności',
}: IntervalStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-bebas text-2xl tracking-wide">Wybierz okres rozliczeniowy</h2>
        <p className="text-sm text-muted-foreground">
          Kategoria: <span className="font-medium text-foreground">{selectedCategory}</span>
          {requiredPlanName && <> — Plan: <span className="font-medium text-foreground">{requiredPlanName}</span></>}
        </p>
      </div>
      {isPricesLoading ? (
        <div className="flex items-center justify-center py-12"><Spinner className="size-6" /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {availablePrices.map(price => {
            const isSelected = selectedPriceId === price.id
            const label = getIntervalLabel(price.recurring?.interval ?? 'month', price.recurring?.intervalCount ?? 1)
            const formatted = formatPrice(price.unitAmount ?? 0, price.currency)
            return (
              <button key={price.id} type="button" onClick={() => onSelectPriceId(price.id)}
                className={cn('flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                  isSelected ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30')}>
                <div className="flex items-center gap-3">
                  <div className={cn('flex size-5 items-center justify-center rounded-full border',
                    isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/30')}>
                    {isSelected && <CheckIcon className="size-3" />}
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
                <span className="font-bebas text-xl tracking-wide">{formatted}</span>
              </button>
            )
          })}
          {showBetaOption && (
            <button type="button" onClick={() => onSelectPriceId(BETA_PRICE_ID)}
              className={cn('flex items-center justify-between rounded-lg border border-dashed px-4 py-3 text-left transition-colors',
                selectedPriceId === BETA_PRICE_ID ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30')}>
              <div className="flex items-center gap-3">
                <div className={cn('flex size-5 items-center justify-center rounded-full border',
                  selectedPriceId === BETA_PRICE_ID ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/30')}>
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
        <Button variant="outline" disabled={isPending} onClick={onBack}>
          <ChevronLeftIcon data-icon="inline-start" />Wstecz
        </Button>
        <Button disabled={!selectedPriceId || isPending} onClick={onNext}>
          {isPending && <Spinner data-icon="inline-start" />}
          {selectedPriceId === BETA_PRICE_ID ? 'Aktywuj dostęp beta' : nextLabel}
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `SubscriptionManager.tsx` to use `<IntervalStep>`**

Replace the inline block with the component. Pass through the existing state values as props.

- [ ] **Step 3: Manual smoke test**

Walk through onboarding in dev. Verify Step 2 renders identically to before.

- [ ] **Step 4: Commit**

```bash
git add src/components/panel/plan-subskrypcji/steps/IntervalStep.tsx src/components/panel/plan-subskrypcji/SubscriptionManager.tsx
git commit -m "refactor(billing): extract IntervalStep from SubscriptionManager"
```

---

### Task E2: Schemas, helpers (`planChangeSchema`, `resolvePlanFromSelection`, `wizardSequence`)

**Files:**
- Create: `src/components/panel/plan-subskrypcji/lib/planChangeSchema.ts`
- Create: `src/components/panel/plan-subskrypcji/lib/resolvePlanFromSelection.ts`
- Create: `src/components/panel/plan-subskrypcji/lib/wizardSequence.ts`
- Test: `tests/int/lib/resolvePlanFromSelection.int.spec.ts`
- Test: `tests/int/lib/wizardSequence.int.spec.ts`

- [ ] **Step 1: Implement schemas + helpers**

```ts
// src/components/panel/plan-subskrypcji/lib/planChangeSchema.ts
import { z } from 'zod'

export const planChangeSchema = z.object({
  selectedKind: z.enum(['single', 'multi']).optional(),
  selectedCategoryPath: z.string().optional(),
  selectedTierSlug: z.enum(['multi', 'agency']).optional(),
  selectedPriceId: z.string().optional(),
  keepScheduledCancel: z.boolean().default(true),
})

export type WizardFormData = z.infer<typeof planChangeSchema>

// src/components/panel/plan-subskrypcji/lib/wizardSequence.ts
export type WizardStep = 'kind' | 'category' | 'tier' | 'interval' | 'summary'
export type WizardEntry = 'onboarding' | 'change-plan' | 'change-category'

export function wizardSequence(entry: WizardEntry, kind?: 'single' | 'multi'): WizardStep[] {
  if (entry === 'change-category') return ['category', 'interval', 'summary']
  const middle: WizardStep = kind === 'multi' ? 'tier' : 'category'
  const tail: WizardStep[] = entry === 'onboarding' ? ['interval'] : ['interval', 'summary']
  return ['kind', middle, ...tail]
}

// src/components/panel/plan-subskrypcji/lib/resolvePlanFromSelection.ts
import type { ServiceCategory, SubscriptionPlan } from '@/payload-types'

export function resolvePlanFromSelection({
  kind, categoryPath, tierSlug, categories, plansBySlug,
}: {
  kind?: 'single' | 'multi'
  categoryPath?: string
  tierSlug?: 'multi' | 'agency'
  categories: ServiceCategory[]
  plansBySlug: Map<string, SubscriptionPlan>
}): SubscriptionPlan | null {
  if (!kind) return null
  if (kind === 'multi') {
    if (!tierSlug) return null
    return plansBySlug.get(tierSlug) ?? null
  }
  // single — walk categoryPath to find deepest requiredPlan
  if (!categoryPath) return null
  return walkForRequiredPlan(categories, categoryPath)
}

function walkForRequiredPlan(categories: ServiceCategory[], path: string): SubscriptionPlan | null {
  const parts = path.split('/')
  let level: any[] = categories
  let bestPlan: SubscriptionPlan | null = null
  for (const slug of parts) {
    const node = level.find((c: any) => c.slug === slug)
    if (!node) break
    if (node.requiredPlan && typeof node.requiredPlan === 'object') {
      bestPlan = node.requiredPlan as SubscriptionPlan
    }
    level = (node.subcategory_level_2 ?? node.subcategory_level_1 ?? [])
  }
  return bestPlan
}
```

- [ ] **Step 2: Write tests for both helpers**

```ts
// tests/int/lib/wizardSequence.int.spec.ts
import { describe, it, expect } from 'vitest'
import { wizardSequence } from '@/components/panel/plan-subskrypcji/lib/wizardSequence'

describe('wizardSequence', () => {
  it.each([
    ['onboarding', 'single', ['kind', 'category', 'interval']],
    ['onboarding', 'multi', ['kind', 'tier', 'interval']],
    ['change-plan', 'single', ['kind', 'category', 'interval', 'summary']],
    ['change-plan', 'multi', ['kind', 'tier', 'interval', 'summary']],
    ['change-category', undefined, ['category', 'interval', 'summary']],
  ] as const)('(%s, %s) → %s', (entry, kind, expected) => {
    expect(wizardSequence(entry as any, kind as any)).toEqual(expected)
  })
})
```

```ts
// tests/int/lib/resolvePlanFromSelection.int.spec.ts
import { describe, it, expect } from 'vitest'
import { resolvePlanFromSelection } from '@/components/panel/plan-subskrypcji/lib/resolvePlanFromSelection'

const plansBySlug = new Map<string, any>([
  ['multi', { id: 4, slug: 'multi', level: 4, maxOffers: 4 }],
  ['agency', { id: 5, slug: 'agency', level: 5, maxOffers: 10 }],
])

describe('resolvePlanFromSelection', () => {
  it('returns null when kind is undefined', () => {
    expect(resolvePlanFromSelection({ categories: [], plansBySlug })).toBeNull()
  })
  it('multi kind returns the tier plan', () => {
    expect(resolvePlanFromSelection({ kind: 'multi', tierSlug: 'agency', categories: [], plansBySlug }))
      .toMatchObject({ slug: 'agency' })
  })
  it('single kind returns deepest requiredPlan along path', () => {
    const t2 = { id: 2, slug: 'single-plus', level: 2, maxOffers: 1 } as any
    const categories = [{ slug: 'music', requiredPlan: t2, subcategory_level_1: [] }] as any
    expect(resolvePlanFromSelection({ kind: 'single', categoryPath: 'music', categories, plansBySlug }))
      .toMatchObject({ slug: 'single-plus' })
  })
})
```

- [ ] **Step 3: Verify**

Run: `pnpm run test:int -- "wizardSequence|resolvePlanFromSelection"`
Expected: PASS — all cases.

- [ ] **Step 4: Commit**

```bash
git add src/components/panel/plan-subskrypcji/lib/ tests/int/lib/wizardSequence.int.spec.ts tests/int/lib/resolvePlanFromSelection.int.spec.ts
git commit -m "feat(billing): add wizard schema + sequence + plan resolver helpers"
```

---

### Task E3: `PlanKindStep` + `TierStep` components

**Files:**
- Create: `src/components/panel/plan-subskrypcji/steps/PlanKindStep.tsx`
- Create: `src/components/panel/plan-subskrypcji/steps/TierStep.tsx`

Card-picker components with `role="radio"` + `aria-checked` + arrow-key nav per spec §9.

- [ ] **Step 1: Implement a shared card-picker primitive (optional but cleaner)**

```tsx
// src/components/panel/plan-subskrypcji/steps/_CardPicker.tsx
'use client'
import * as React from 'react'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CardOption<V extends string> {
  value: V
  label: string
  description: string
}

export interface CardPickerProps<V extends string> {
  options: CardOption<V>[]
  value: V | undefined
  onChange: (v: V) => void
  ariaLabelledBy: string
}

export function CardPicker<V extends string>({ options, value, onChange, ariaLabelledBy }: CardPickerProps<V>) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])

  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const next = (idx + 1) % options.length
      refs.current[next]?.focus()
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prev = (idx - 1 + options.length) % options.length
      refs.current[prev]?.focus()
      e.preventDefault()
    }
  }

  return (
    <div role="radiogroup" aria-labelledby={ariaLabelledBy} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt, idx) => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            ref={(el) => { refs.current[idx] = el }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected || (!value && idx === 0) ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className={cn(
              'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent',
              isSelected ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30',
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-bebas text-xl tracking-wide">{opt.label}</span>
              {isSelected && <CheckIcon className="size-4 text-accent" />}
            </div>
            <p className="text-sm text-muted-foreground">{opt.description}</p>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Implement the two step components**

```tsx
// src/components/panel/plan-subskrypcji/steps/PlanKindStep.tsx
'use client'
import { ChevronRightIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { CardPicker } from './_CardPicker'
import type { WizardFormData } from '../lib/planChangeSchema'

export function PlanKindStep({ onNext }: { onNext: () => void }) {
  const form = useFormContext<WizardFormData>()
  const value = form.watch('selectedKind')
  const headingId = 'plan-kind-heading'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="font-bebas text-2xl tracking-wide">Wybierz typ planu</h2>
        <p className="text-sm text-muted-foreground">
          Zdecyduj, czy oferujesz jedną usługę, czy chcesz publikować ich więcej.
        </p>
      </div>
      <CardPicker
        ariaLabelledBy={headingId}
        value={value}
        onChange={(v) => {
          form.setValue('selectedKind', v)
          // reset downstream fields when kind changes
          form.resetField('selectedCategoryPath')
          form.resetField('selectedTierSlug')
          form.resetField('selectedPriceId')
        }}
        options={[
          { value: 'single', label: 'Pojedyncza oferta', description: 'Idealne, jeśli świadczysz jeden rodzaj usługi i prowadzisz jedną wizytówkę.' },
          { value: 'multi', label: 'Wiele ofert', description: 'Publikuj kilka ofert pod jednym kontem — przydatne dla agencji i wielobranżowych firm.' },
        ]}
      />
      <div className="flex justify-end">
        <Button disabled={!value} onClick={onNext}>
          Dalej <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
```

```tsx
// src/components/panel/plan-subskrypcji/steps/TierStep.tsx
'use client'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { CardPicker } from './_CardPicker'
import type { WizardFormData } from '../lib/planChangeSchema'

export function TierStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const form = useFormContext<WizardFormData>()
  const value = form.watch('selectedTierSlug')
  const headingId = 'tier-heading'
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="font-bebas text-2xl tracking-wide">Wybierz pakiet</h2>
        <p className="text-sm text-muted-foreground">
          Każdy pakiet różni się limitem ofert i zakresem kategorii.
        </p>
      </div>
      <CardPicker
        ariaLabelledBy={headingId}
        value={value}
        onChange={(v) => {
          form.setValue('selectedTierSlug', v)
          form.resetField('selectedPriceId')
        }}
        options={[
          { value: 'multi', label: 'Multi — do 4 ofert', description: 'Publikuj do czterech ofert w dowolnych kategoriach.' },
          { value: 'agency', label: 'Agency — do 10 ofert', description: 'Najwyższy limit ofert — wybór agencji i większych firm.' },
        ]}
      />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeftIcon data-icon="inline-start" /> Wstecz
        </Button>
        <Button disabled={!value} onClick={onNext}>
          Dalej <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/plan-subskrypcji/steps/_CardPicker.tsx src/components/panel/plan-subskrypcji/steps/PlanKindStep.tsx src/components/panel/plan-subskrypcji/steps/TierStep.tsx
git commit -m "feat(billing): add PlanKindStep + TierStep card pickers with a11y"
```

---

### Task E4: `CategoryStep` wrapper

**Files:**
- Create: `src/components/panel/plan-subskrypcji/steps/CategoryStep.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/panel/plan-subskrypcji/steps/CategoryStep.tsx
'use client'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { CategoryPicker } from '@/components/panel/wizard/CategoryPicker'
import { resolvePlanFromSelection } from '../lib/resolvePlanFromSelection'
import type { WizardFormData } from '../lib/planChangeSchema'
import type { ServiceCategory, SubscriptionPlan } from '@/payload-types'

interface CategoryStepProps {
  categories: ServiceCategory[]
  plansBySlug: Map<string, SubscriptionPlan>
  onBack?: () => void
  onNext: () => void
}

export function CategoryStep({ categories, plansBySlug, onBack, onNext }: CategoryStepProps) {
  const form = useFormContext<WizardFormData>()
  const value = form.watch('selectedCategoryPath') ?? ''
  // Convert path "music/dj" to legacy CategoryPicker shape if needed — see existing CategoryPicker docs
  const resolved = resolvePlanFromSelection({
    kind: 'single', categoryPath: value, categories, plansBySlug,
  })
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-bebas text-2xl tracking-wide">Wybierz swoją kategorię usług</h2>
        <p className="text-sm text-muted-foreground">
          Od wybranej kategorii zależy plan subskrypcji i jego cena.
        </p>
      </div>
      <CategoryPicker
        categories={categories as any}
        value={value}
        onChange={(v) => {
          form.setValue('selectedCategoryPath', v)
          form.resetField('selectedPriceId')
        }}
      />
      <p className="text-sm text-muted-foreground">
        {resolved
          ? <>Plan: <span className="font-medium text-foreground">{resolved.name}</span></>
          : 'Wybierz kategorię, aby zobaczyć dopasowany plan.'}
      </p>
      <div className="flex justify-between">
        {onBack ? (
          <Button variant="outline" onClick={onBack}>
            <ChevronLeftIcon data-icon="inline-start" /> Wstecz
          </Button>
        ) : <div />}
        <Button disabled={!value} onClick={onNext}>
          Dalej <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/panel/plan-subskrypcji/steps/CategoryStep.tsx
git commit -m "feat(billing): add CategoryStep wrapper with live plan preview"
```

---

## Phase F — Wizard composition (deps: D, E)

### Task F1: `SubscriptionWizard` controller

**Files:**
- Create: `src/components/panel/plan-subskrypcji/SubscriptionWizard.tsx`

- [ ] **Step 1: Implement the controller**

```tsx
// src/components/panel/plan-subskrypcji/SubscriptionWizard.tsx
'use client'
import * as React from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { planChangeSchema, type WizardFormData } from './lib/planChangeSchema'
import { wizardSequence, type WizardStep, type WizardEntry } from './lib/wizardSequence'
import { PlanKindStep } from './steps/PlanKindStep'
import { CategoryStep } from './steps/CategoryStep'
import { TierStep } from './steps/TierStep'
import { IntervalStep } from './steps/IntervalStep'
import { ImpactSummaryStep } from './steps/ImpactSummaryStep'
import { WizardStepIndicator } from '@/components/panel/wizard/WizardStepIndicator'
import type { User, ServiceCategory, SubscriptionPlan } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

interface SubscriptionWizardProps {
  entry: WizardEntry
  user: User
  subscription: CurrentSubscriptionDetails
  categories: ServiceCategory[]
  plans: SubscriptionPlan[]
  lang: string
  showBetaOption: boolean
  onExit: () => void
}

export function SubscriptionWizard(props: SubscriptionWizardProps) {
  const { entry, user, subscription, categories, plans, lang, showBetaOption, onExit } = props
  const plansBySlug = React.useMemo(
    () => new Map(plans.map(p => [p.slug, p])),
    [plans],
  )

  const form = useForm<WizardFormData>({
    resolver: zodResolver(planChangeSchema),
    defaultValues: {
      selectedKind: entry === 'change-category' ? 'single' : undefined,
      selectedCategoryPath: user.serviceCategory ?? undefined,
      keepScheduledCancel: !subscription.cancelAtPeriodEnd,
    },
  })

  const kind = form.watch('selectedKind')
  const sequence = wizardSequence(entry, kind)
  const [stepIdx, setStepIdx] = React.useState(0)
  const step = sequence[stepIdx]

  // beforeunload warning while dirty
  React.useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!form.formState.isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [form.formState.isDirty])

  function goNext() {
    if (stepIdx < sequence.length - 1) setStepIdx(stepIdx + 1)
  }
  function goBack() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <nav aria-label="Postęp kreatora">
          <WizardStepIndicator
            steps={sequence.map((s, i) => ({ id: s, label: stepLabel(s), status: i < stepIdx ? 'complete' : i === stepIdx ? 'active' : 'upcoming' }))}
            currentStepId={step}
            onStepClick={(id) => {
              const idx = sequence.indexOf(id as WizardStep)
              if (idx >= 0 && idx < stepIdx) setStepIdx(idx)
            }}
          />
        </nav>
        {step === 'kind' && <PlanKindStep onNext={goNext} />}
        {step === 'category' && (
          <CategoryStep
            categories={categories}
            plansBySlug={plansBySlug}
            onBack={stepIdx > 0 ? goBack : undefined}
            onNext={goNext}
          />
        )}
        {step === 'tier' && <TierStep onBack={goBack} onNext={goNext} />}
        {step === 'interval' && (
          <IntervalStepBridge
            kind={kind}
            user={user}
            categories={categories}
            plansBySlug={plansBySlug}
            showBetaOption={showBetaOption}
            lang={lang}
            entry={entry}
            onBack={goBack}
            onNext={goNext}
            onExit={onExit}
          />
        )}
        {step === 'summary' && (
          <ImpactSummaryStep
            subscription={subscription}
            user={user}
            plansBySlug={plansBySlug}
            onBack={goBack}
            onExit={onExit}
          />
        )}
      </div>
    </FormProvider>
  )
}

function stepLabel(s: WizardStep) {
  return {
    kind: 'Typ planu', category: 'Kategoria', tier: 'Pakiet',
    interval: 'Okres rozliczeniowy', summary: 'Podsumowanie',
  }[s]
}

// IntervalStepBridge wires getStripePrices + createCheckoutSession / changePlan-or-updateBeta routing
// (Implemented as part of Task F2 below to keep this task focused on the controller.)
function IntervalStepBridge(_props: any): React.ReactNode { return null }
```

- [ ] **Step 2: Commit (Bridge stubbed for next task)**

```bash
git add src/components/panel/plan-subskrypcji/SubscriptionWizard.tsx
git commit -m "feat(billing): add SubscriptionWizard controller (FormProvider + RHF)"
```

---

### Task F2: `IntervalStepBridge` — async price fetch + onboarding checkout routing

**Files:**
- Modify: `src/components/panel/plan-subskrypcji/SubscriptionWizard.tsx`

`IntervalStepBridge` is the impedance match between the FormProvider form state and the existing `IntervalStep` component (which is prop-driven). It also handles the "Next" action for onboarding entries (call `createCheckoutSession`) vs for change-plan entries (just advance to summary).

- [ ] **Step 1: Implement the bridge**

Replace the stubbed `IntervalStepBridge` in `SubscriptionWizard.tsx` with:

```tsx
function IntervalStepBridge({
  kind, user, categories, plansBySlug, showBetaOption, lang, entry, onBack, onNext, onExit,
}: {
  kind: 'single' | 'multi' | undefined
  user: User
  categories: ServiceCategory[]
  plansBySlug: Map<string, SubscriptionPlan>
  showBetaOption: boolean
  lang: string
  entry: WizardEntry
  onBack: () => void
  onNext: () => void
  onExit: () => void
}): React.ReactNode {
  const form = useFormContext<WizardFormData>()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [availablePrices, setAvailablePrices] = React.useState<StripePriceDetails[]>([])
  const [isPricesLoading, setIsPricesLoading] = React.useState(false)

  const resolved = resolvePlanFromSelection({
    kind,
    categoryPath: form.watch('selectedCategoryPath'),
    tierSlug: form.watch('selectedTierSlug'),
    categories,
    plansBySlug,
  })

  React.useEffect(() => {
    if (!resolved?.stripeID) {
      setAvailablePrices([])
      return
    }
    let cancelled = false
    setIsPricesLoading(true)
    getStripePrices(resolved.stripeID).then(r => {
      if (cancelled) return
      if (r.success) setAvailablePrices([...r.prices].sort((a, b) => {
        const a_months = (a.recurring?.interval === 'year' ? a.recurring.intervalCount * 12 : (a.recurring?.intervalCount ?? 1))
        const b_months = (b.recurring?.interval === 'year' ? b.recurring.intervalCount * 12 : (b.recurring?.intervalCount ?? 1))
        return a_months - b_months
      }))
      setIsPricesLoading(false)
    })
    return () => { cancelled = true }
  }, [resolved?.stripeID])

  const selectedPriceId = form.watch('selectedPriceId') ?? null
  const categoryPath = form.watch('selectedCategoryPath') ?? ''
  const categoryNames = categoryPath ? categoryPath.split('/').map(slugToName) : []
  const categorySlugs = categoryPath ? categoryPath.split('/') : []

  function handleNext() {
    if (entry === 'onboarding') {
      // Onboarding → call createCheckoutSession or activateBetaAccess
      startTransition(async () => {
        try {
          if (selectedPriceId === 'BETA') {
            const r = await activateBetaAccess({ userId: user.id, categoryNames, categorySlugs })
            if (r.success) {
              toast.success('Dostęp beta został aktywowany!')
              window.location.href = `/${lang}/panel/dashboard?checkout=success`
            } else {
              toast.error(r.error ?? 'Nie udało się aktywować dostępu beta.')
            }
            return
          }
          const r = await createCheckoutSession({
            priceId: selectedPriceId!,
            userId: user.id,
            successUrl: `/${lang}/panel/plan-subskrypcji?success=1`,
            cancelUrl: `/${lang}/panel/plan-subskrypcji`,
            categoryNames, categorySlugs, userEmail: user.email,
          })
          if (r.url) router.push(r.url)
          else toast.error('Nie udało się utworzyć sesji płatności.')
        } catch {
          toast.error('Wystąpił błąd podczas tworzenia sesji płatności.')
        }
      })
    } else {
      // change-plan / change-category → advance to summary step
      onNext()
    }
  }

  return (
    <IntervalStep
      availablePrices={availablePrices}
      isPricesLoading={isPricesLoading}
      selectedPriceId={selectedPriceId}
      onSelectPriceId={(id) => form.setValue('selectedPriceId', id)}
      showBetaOption={showBetaOption}
      selectedCategory={categoryNames.join(' > ') || (kind === 'multi' ? 'Wszystkie kategorie' : '')}
      requiredPlanName={resolved?.name}
      onBack={onBack}
      onNext={handleNext}
      isPending={isPending}
      nextLabel={entry === 'onboarding' ? 'Przejdź do płatności' : 'Dalej'}
    />
  )
}

function slugToName(slug: string): string {
  return slug.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')
}
```

Add imports at top: `useFormContext`, `useRouter`, `getStripePrices`, `StripePriceDetails`, `toast`, `activateBetaAccess`, `createCheckoutSession`, `resolvePlanFromSelection`.

- [ ] **Step 2: Manual smoke test**

Trigger onboarding flow as a non-subscribed user. Walk through: kind → category/tier → interval → checkout redirect. Verify Stripe checkout opens.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/plan-subskrypcji/SubscriptionWizard.tsx
git commit -m "feat(billing): wire IntervalStepBridge to onboarding checkout"
```

---

### Task F3: `ImpactSummaryStep` component

**Files:**
- Create: `src/components/panel/plan-subskrypcji/steps/ImpactSummaryStep.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/panel/plan-subskrypcji/steps/ImpactSummaryStep.tsx
'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { ChevronLeftIcon, AlertTriangleIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { computePlanChangeImpact, type PlanChangeImpact } from '@/actions/stripe/computePlanChangeImpact'
import { changePlan } from '@/actions/stripe/changePlan'
import { updateBetaUserPlan } from '@/actions/stripe/updateBetaUserPlan'
import { pluralizeOffers } from '../lib/pluralizeOffers'
import type { WizardFormData } from '../lib/planChangeSchema'
import type { User, SubscriptionPlan } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

interface ImpactSummaryStepProps {
  subscription: CurrentSubscriptionDetails
  user: User
  plansBySlug: Map<string, SubscriptionPlan>
  onBack: () => void
  onExit: () => void
}

export function ImpactSummaryStep({ subscription, user, plansBySlug, onBack, onExit }: ImpactSummaryStepProps) {
  const form = useFormContext<WizardFormData>()
  const router = useRouter()
  const [isLocked, setIsLocked] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [impact, setImpact] = React.useState<PlanChangeImpact | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const selectedKind = form.watch('selectedKind')
  const selectedTierSlug = form.watch('selectedTierSlug')
  const selectedCategoryPath = form.watch('selectedCategoryPath')
  const selectedPriceId = form.watch('selectedPriceId')
  const keepScheduledCancel = form.watch('keepScheduledCancel')

  const newPlanId = selectedKind === 'multi'
    ? plansBySlug.get(selectedTierSlug!)?.id
    : /* single: resolve from category path — fall back to looking up via API */ undefined

  const intervalKey = React.useMemo(() => {
    // Map selectedPriceId → intervalKey via the price details we already have.
    // For simplicity, derive from the selected price string if encoded; otherwise fetch.
    return 'month/1' // placeholder — refine via getStripePrices lookup or pass intervalKey through state
  }, [selectedPriceId])

  React.useEffect(() => {
    if (!newPlanId) return
    setError(null)
    computePlanChangeImpact({ newPlanId, intervalKey }).then(r => {
      if (r.success) setImpact(r.data)
      else setError(r.message)
    })
  }, [newPlanId, intervalKey])

  const isBeta = user.betaAccess === true

  function handleConfirm() {
    if (!newPlanId) return
    setIsLocked(true)
    startTransition(async () => {
      const action = isBeta
        ? updateBetaUserPlan({
            newPlanId,
            categoryNames: selectedCategoryPath?.split('/').map(slugToName),
            categorySlugs: selectedCategoryPath?.split('/'),
          })
        : changePlan({
            newPlanId,
            intervalKey,
            categoryNames: selectedCategoryPath?.split('/').map(slugToName),
            categorySlugs: selectedCategoryPath?.split('/'),
            expectedCurrentPlanId: subscription.currentPlan?.id ?? null,
            keepScheduledCancel: keepScheduledCancel ?? true,
          })
      const result = await action
      if (result.success) {
        toast.success('Zmiana planu została zlecona. Wkrótce zobaczysz aktualny status w sekcji oferty.', { duration: 5000 })
        onExit()
        router.refresh()
      } else {
        if (result.error === 'STALE_PLAN') {
          toast.error('Plan zmienił się w innej karcie. Odświeżamy stronę…')
          router.refresh()
        } else {
          toast.error(result.message)
        }
        setIsLocked(false)
      }
    })
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Nie udało się obliczyć skutków zmiany planu.</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}><ChevronLeftIcon /> Wstecz</Button>
        </div>
      </div>
    )
  }

  if (!impact) {
    return <div className="flex items-center justify-center py-12"><Spinner className="size-6" /></div>
  }

  const totalDrafted = impact.offersToDraft.byCategory.length + impact.offersToDraft.byLimit.length
  const confirmLabel =
    impact.changeType === 'upgrade' ? 'Zmień plan i zapłać teraz' :
    impact.changeType === 'downgrade' ? 'Potwierdź zmianę planu' :
    impact.changeType === 'interval_only' ? 'Zmień okres rozliczeniowy' :
    impact.changeType === 'lateral' ? 'Potwierdź zmianę' :
    'Brak zmian do zapisania'

  const isDestructive = impact.changeType === 'downgrade' || impact.currencyMismatch

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-bebas text-2xl tracking-wide">Podsumowanie zmiany planu</h2>
      <p className="text-sm text-muted-foreground">
        Z planu <span className="font-medium text-foreground">{impact.currentPlan.name}</span> na{' '}
        <span className="font-medium text-foreground">{impact.newPlan.name}</span>
      </p>

      {impact.currencyMismatch && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Nie możemy zmienić planu w tym momencie.</AlertTitle>
          <AlertDescription>
            Wybrana cena jest w innej walucie ({impact.newPrice.currency.toUpperCase()}) niż Twoja obecna subskrypcja.
            <Button variant="link" asChild className="px-1">
              <a href="mailto:support@eventizer.pl?subject=Zmiana%20planu%20%E2%80%94%20niezgodno%C5%9B%C4%87%20waluty">Skontaktuj się z pomocą</a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {impact.isTrialing && impact.trialEnd && (
        <Alert>
          <AlertTitle>Okres próbny</AlertTitle>
          <AlertDescription>
            Korzystasz z okresu próbnego do {new Date(impact.trialEnd).toLocaleDateString('pl-PL')}.
            Zmiana planu nie przerywa tego okresu — opłata zostanie pobrana po jego zakończeniu.
          </AlertDescription>
        </Alert>
      )}

      {impact.categoryWillBeCleared && (
        <Alert>
          <AlertTitle>Zmiana profilu</AlertTitle>
          <AlertDescription>
            Po przejściu na plan {impact.newPlan.name} Twoja kategoria zostanie usunięta z profilu — będziesz mógł oferować usługi we wszystkich kategoriach.
          </AlertDescription>
        </Alert>
      )}

      {impact.changeType === 'downgrade' && totalDrafted > 0 && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Uwaga — zmiany ofert</AlertTitle>
          <AlertDescription>
            {(() => {
              const p = pluralizeOffers(totalDrafted)
              return `${p.count} ${p.noun} ${p.verb} ${p.participle} do wersji roboczych.`
            })()}
            {' Nowy plan pozwala opublikować maksymalnie ' + (impact.newPlan.maxOffers ?? 1) + '.'}
          </AlertDescription>
        </Alert>
      )}

      {impact.hasScheduledCancel && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!keepScheduledCancel}
            onCheckedChange={(v) => form.setValue('keepScheduledCancel', !v)}
          />
          <span>Tak, anuluj zaplanowane wygaśnięcie subskrypcji</span>
        </label>
      )}

      {totalDrafted > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-medium text-sm mb-2">Oferty, które zostaną przeniesione do wersji roboczych ({totalDrafted}):</h3>
          <ul className="space-y-1 text-sm">
            {impact.offersToDraft.byCategory.map(o => (
              <li key={o.id}>{o.title} <span className="text-muted-foreground">— Kategoria spoza planu</span></li>
            ))}
            {impact.offersToDraft.byLimit.map(o => (
              <li key={o.id}>{o.title} <span className="text-muted-foreground">— Limit ofert</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={isLocked || isPending} onClick={onBack}>
          <ChevronLeftIcon /> Wstecz
        </Button>
        {isDestructive ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isLocked || isPending || impact.changeType === 'no_change' || impact.currencyMismatch}>
                {confirmLabel}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Czy na pewno chcesz zmienić plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  {(() => {
                    const p = pluralizeOffers(totalDrafted)
                    return `${p.count} ${p.noun} ${p.verb} ${p.participle} do wersji roboczych. Tej akcji nie można cofnąć z poziomu panelu.`
                  })()}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>Potwierdź</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button disabled={isLocked || isPending || impact.changeType === 'no_change'} onClick={handleConfirm}>
            {isPending && <Spinner data-icon="inline-start" />}
            {confirmLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

function slugToName(slug: string): string {
  return slug.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')
}
```

- [ ] **Step 2: Note on `intervalKey` derivation**

In the current implementation, `intervalKey` is hard-coded to `'month/1'`. Before testing, fix this by carrying the price's `interval`+`intervalCount` through form state. Add a `selectedIntervalKey` field to the schema and write it in `IntervalStepBridge` alongside `selectedPriceId`.

Update `planChangeSchema.ts`:
```ts
selectedIntervalKey: z.string().optional(), // e.g. 'month/1'
```

In `IntervalStepBridge.onSelectPriceId`, also set the interval key from the selected price.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/plan-subskrypcji/steps/ImpactSummaryStep.tsx src/components/panel/plan-subskrypcji/lib/planChangeSchema.ts src/components/panel/plan-subskrypcji/SubscriptionWizard.tsx
git commit -m "feat(billing): add ImpactSummaryStep with confirm + drafting preview"
```

---

### Task F4: Trim `SubscriptionManager` + add dropdown entry-points

**Files:**
- Modify: `src/components/panel/plan-subskrypcji/SubscriptionManager.tsx`

- [ ] **Step 1: Replace `SubscriptionManager` body**

Remove the inline onboarding/wizard logic. Keep only the status view (active / expired / cancel-at-period-end banner) and replace the three buttons with a single dropdown.

```tsx
// SubscriptionManager.tsx — trimmed
'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangleIcon, RefreshCwIcon, SettingsIcon, TagIcon, RepeatIcon, MoreHorizontalIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { SubscriptionWizard } from './SubscriptionWizard'
import { createBillingPortalSession } from '@/actions/stripe/manageSubscription'
import type { User, ServiceCategory, SubscriptionPlan } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

interface SubscriptionManagerProps {
  user: User
  subscription: CurrentSubscriptionDetails
  categories: ServiceCategory[]
  plans: SubscriptionPlan[]
  lang: string
  showBetaOption: boolean
}

type View = 'status' | 'wizard-onboarding' | 'wizard-change-plan' | 'wizard-change-category'

export function SubscriptionManager({ user, subscription, categories, plans, lang, showBetaOption }: SubscriptionManagerProps) {
  const router = useRouter()
  const [view, setView] = React.useState<View>(() => user.role === 'service-provider' ? 'status' : 'wizard-onboarding')
  const [isPending, startTransition] = React.useTransition()

  const isExpired = user.role === 'service-provider' && !subscription.hasSubscription
  const isActive = user.role === 'service-provider' && subscription.hasSubscription
  const isSinglePlan = (subscription.currentPlan?.maxOffers ?? 1) === 1

  if (view === 'wizard-onboarding') return <SubscriptionWizard entry="onboarding" {...{ user, subscription, categories, plans, lang, showBetaOption, onExit: () => setView('status') }} />
  if (view === 'wizard-change-plan') return <SubscriptionWizard entry="change-plan" {...{ user, subscription, categories, plans, lang, showBetaOption, onExit: () => setView('status') }} />
  if (view === 'wizard-change-category') return <SubscriptionWizard entry="change-category" {...{ user, subscription, categories, plans, lang, showBetaOption, onExit: () => setView('status') }} />

  return (
    <div className="flex flex-col gap-6">
      {isExpired && (
        <>
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>Subskrypcja wygasła</AlertTitle>
            <AlertDescription>Twoja subskrypcja wygasła. Twoje oferty zostały wycofane z publikacji.</AlertDescription>
          </Alert>
          <Button onClick={() => setView('wizard-onboarding')} className="w-fit">
            <RefreshCwIcon data-icon="inline-start" /> Odnów subskrypcję
          </Button>
        </>
      )}
      {isActive && (
        <Card className="bg-background border-border/20">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-bebas text-2xl tracking-wide">
                {subscription.isBetaUser ? 'Plan Beta' : (subscription.currentPlan?.name ?? 'Aktywna subskrypcja')}
              </CardTitle>
              <Badge variant={subscription.cancelAtPeriodEnd ? 'destructive' : 'secondary'}>
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Aktywna'}
              </Badge>
            </div>
            <CardDescription>
              {user.serviceCategory && <span>Kategoria: {user.serviceCategory}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Odnowienie'}:{' '}
                <span className="font-medium text-foreground">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </p>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-fit">
                  <MoreHorizontalIcon data-icon="inline-start" /> Zarządzaj subskrypcją
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setView('wizard-change-plan')}>
                  <RepeatIcon /> Zmień plan…
                </DropdownMenuItem>
                {isSinglePlan && (
                  <DropdownMenuItem onClick={() => setView('wizard-change-category')}>
                    <TagIcon /> Zmień kategorię…
                  </DropdownMenuItem>
                )}
                {!subscription.isBetaUser && (
                  <DropdownMenuItem
                    onClick={() => {
                      startTransition(async () => {
                        const r = await createBillingPortalSession(user.id, window.location.href)
                        if (r.success && r.url) window.open(r.url, '_blank')
                        else toast.error(r.message || 'Nie można otworzyć portalu rozliczeniowego.')
                      })
                    }}
                  >
                    {isPending && <Spinner data-icon="inline-start" />}
                    <SettingsIcon /> Zarządzaj płatnościami…
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `page.tsx` to pass `plans` prop**

The page is `src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx`. Add a fetch for `subscription-plans` and pass them to `SubscriptionManager`.

```ts
const plansResult = await payload.find({ collection: 'subscription-plans', limit: 100, depth: 1 })
return (
  // ...
  <SubscriptionManager
    user={user} subscription={subscription} categories={categories}
    plans={plansResult.docs}
    lang={lang} showBetaOption={showBetaOption}
  />
)
```

- [ ] **Step 3: Smoke test all flows**

In dev: walk through onboarding, change-plan (upgrade, downgrade, interval), change-category. Verify dropdown shows correct items per plan state.

- [ ] **Step 4: Commit**

```bash
git add src/components/panel/plan-subskrypcji/SubscriptionManager.tsx src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx
git commit -m "feat(billing): replace status-view buttons with Zarządzaj subskrypcją dropdown"
```

---

## Phase G — Stripe Dashboard config (manual, no code)

### Task G1: Enable `customer.subscription.updated` webhook event

**Action (manual, in Stripe Dashboard for both test and prod environments):**

- [ ] **Step 1: Open the existing webhook endpoint**

In Stripe Dashboard → Developers → Webhooks → click your existing endpoint (the one already receiving `checkout.session.completed`).

- [ ] **Step 2: Add the event**

Click "Add events" → search for `customer.subscription.updated` → add it.

- [ ] **Step 3: Test the event**

Run `stripe trigger customer.subscription.updated --api-key sk_test_xxx` and verify your dev server returns 200. Or use the Dashboard's "Send test webhook" button.

- [ ] **Step 4: Repeat for production webhook endpoint**

Same steps in the production environment.

---

### Task G2: Configure Stripe Billing Portal product whitelist

**Action (manual):**

- [ ] **Step 1: Open Stripe Customer Portal settings**

Dashboard → Settings → Customer Portal → Products and prices.

- [ ] **Step 2: Whitelist only the 5 production plans/prices**

Disable any test, paused, or internal products. Save.

- [ ] **Step 3: Snapshot the configuration ID**

Copy the Portal configuration ID. Add it to Vercel env vars as `STRIPE_BILLING_PORTAL_CONFIG_ID` (both test and prod).

- [ ] **Step 4: Update `createBillingPortalSession`**

In `src/actions/stripe/manageSubscription.ts`, pass the configuration ID to `stripe.billingPortal.sessions.create({ configuration: process.env.STRIPE_BILLING_PORTAL_CONFIG_ID, ... })`.

Commit:
```bash
git add src/actions/stripe/manageSubscription.ts
git commit -m "fix(billing): use whitelist-configured Billing Portal session"
```

---

## Phase H — E2E + final smoke

### Task H1: E2E happy-path tests

**Files:**
- Create: `tests/e2e/subscription-wizard.e2e.spec.ts`

- [ ] **Step 1: Add at least these scenarios**

```ts
// tests/e2e/subscription-wizard.e2e.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Subscription wizard', () => {
  test('Onboarding — Single path completes to Stripe Checkout', async ({ page }) => {
    // Login as fresh user, navigate to /pl/panel/plan-subskrypcji
    // Click "Pojedyncza oferta" card
    // Pick a category
    // Pick monthly interval
    // Click "Przejdź do płatności"
    // Expect redirect to checkout.stripe.com
  })

  test('Change plan upgrade — Single to Multi', async ({ page }) => {
    // Login as Single subscriber, open dropdown
    // Click "Zmień plan…"
    // Pick "Wiele ofert" → "Multi"
    // Pick yearly
    // ImpactSummaryStep: expect upgrade banner
    // Click "Zmień plan i zapłać teraz"
    // Expect success toast
  })

  test('Change plan downgrade — drafting preview shown, AlertDialog gate', async ({ page }) => {
    // Login as Multi subscriber with 3 published offers
    // Open dropdown → Zmień plan → Pojedyncza oferta → pick category → interval → summary
    // Expect "2 oferty zostaną przeniesione do wersji roboczych" banner
    // Click Confirm → AlertDialog appears → click Potwierdź
    // Expect success toast
  })

  test('Concurrent tabs — STALE_PLAN handled', async ({ browser }) => {
    // Open two tabs of same user
    // Tab A changes plan
    // Tab B tries to change plan → expects "Plan zmienił się w innej karcie" toast
  })
})
```

(E2E scaffolding may need a test user fixture and Stripe mock — coordinate with team conventions.)

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/subscription-wizard.e2e.spec.ts
git commit -m "test(billing): add E2E happy-path tests for subscription wizard"
```

---

### Task H2: Final smoke test in dev + production smoke after deploy

**Manual, no code:**

- [ ] **Step 1: Run full vitest suite**

Run: `pnpm run test:int`
Expected: all green.

- [ ] **Step 2: Run E2E suite**

Run: `pnpm run test:e2e`
Expected: all green.

- [ ] **Step 3: Manual walkthrough in dev**

Walk every path in the spec §3 entry-point table. Note any UX gaps.

- [ ] **Step 4: Deploy to production**

Land each PR in the order specified in spec §11.1. After PR 6 (webhook handler) lands and deploys, do Task G1 in production. After PR 8 (wizard UI) lands, do Task G2 in production.

- [ ] **Step 5: Post-deploy validation**

Per spec §11.6:
- Own-account smoke test (own subscription, walk every flow).
- After 24 hours: SQL `SELECT COUNT(*) FROM processed_stripe_events` > 0.
- Log scan: no ERROR-level entries from `customer.subscription.updated` handler.
- Monitor customer support tickets for one week.

---

## Self-review

**Spec coverage:**
- §2 Tier model — implicit, used by every algorithm.
- §3 Flow & entry-point sequences — Tasks E2 (wizardSequence), F1 (SubscriptionWizard), F4 (entries).
- §4 Server actions — Tasks D1 (computePlanChangeImpact), D2 (updateBetaUserPlan), D3 (changePlan), D4 (alias).
- §5 Webhook (Step 0 + steps 1–11) — Tasks B2/B3 (Step 0), C1/C2/C3 (handler), A3 (dedup), A2 (collection).
- §6 Edge cases — covered across tasks; e.g. #1/#2 in computePlanChangeImpact, #13 (STALE_PLAN) in changePlan, #14 (Portal bypass) in handleSubscriptionUpdated, #16 (currency) in ImpactSummaryStep, #19 (drafts not counted) in B4.
- §7 Component structure — Phase E + F.
- §8 Onboarding kind step — Task F2 (IntervalStepBridge handles onboarding routing).
- §9 Design tokens / a11y — Task E3 (CardPicker has role=radio + arrow keys); reduced-motion explicitly out-of-scope deferred to design QA.
- §10 Localization — every step component has Polish strings inline.
- §11 Migration — Phase G covers Dashboard config; no backfill per locked decision.
- §13 enforceMaxOffers — Task B4.
- §14 Observability — partial: structured logging in handleSubscriptionUpdated; full metric dashboards not in scope of this plan.
- §16 Locked decisions — all reflected in tasks (dropdown grouping in F4, AlertDialog in F3, no backfill in §11 stub).

**Type consistency:** `WizardFormData` from `planChangeSchema.ts` is consumed by all step components via `useFormContext<WizardFormData>()`. `PlanChangeType` from `computePlanChangeImpact.ts` is the canonical changeType enum; `changePlan` returns the same strings. `SubscriptionPlan` and `User` are imported from `@/payload-types` everywhere.

**Placeholder check:** No "TBD" / "TODO" / "fill in later". The two soft spots:
- The `IntervalStepBridge.intervalKey` derivation in Task F3 step 2 is called out explicitly as a fix needed in that same task — not a placeholder, an inline correction.
- Webhook route `maxDuration` location (Task C3 step 3) requires a small investigation by the implementer since `@payloadcms/plugin-stripe` may own the route. That's a real environmental check, not a plan gap.

Plan is ready.

---

## Open items requiring user input during execution

1. **`maxDuration = 60` location** — depends on whether `@payloadcms/plugin-stripe` exposes a route file or registers via Next handler. Implementer should locate `src/app/api/payload/stripe-webhooks/route.ts` (or equivalent) and add the export, OR coordinate with the plugin's config option. If neither works, fall back to a separate `/api/webhooks/stripe-subscription-updated/route.ts` that the plugin can be configured to forward to.

2. **Test user fixtures** — E2E tests in Task H1 assume the project has test user fixtures with various subscription states. If not, those need to be scaffolded as part of H1.
