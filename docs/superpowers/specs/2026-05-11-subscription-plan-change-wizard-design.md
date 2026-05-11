# Subscription Plan Change Wizard — Design

**Date:** 2026-05-11
**Status:** Approved for implementation planning (v3 — after two rounds of agent review)
**Area:** `/panel/plan-subskrypcji`

## 1. Problem

Today's `/panel/plan-subskrypcji` supports first-time onboarding (category → billing interval → Stripe Checkout) and a "Zmień kategorię" button that re-enters at the category step.

It does NOT support:

- Picking a tier directly (Multi / Agency have no UI entry point)
- Upgrading or downgrading an existing subscription with proration, drafting offers that no longer fit
- Changing billing interval on the same plan after onboarding

There are 5 tiers in production but the current wizard exposes only the one tied to the user's chosen category. The `updateSubscription` action exists with upgrade/downgrade logic but isn't wired to UI.

This design adds a "Zmień Plan" entry that lets users change tier and/or interval post-onboarding, with an impact summary previewing offer-drafting consequences.

## 2. Tier model

| Tier | Slug         | `level` | `maxOffers` | Category coverage    | How user picks it          |
| ---- | ------------ | ------- | ----------- | -------------------- | -------------------------- |
| 1    | Single       | 1       | 1           | subset               | indirectly (via category)  |
| 2    | Single+      | 2       | 1           | more                 | indirectly (via category)  |
| 3    | Single++     | 3       | 1           | basically all        | indirectly (via category)  |
| 4    | Multi        | 4       | 4           | all                  | directly                   |
| 5    | Agency       | 5       | 10          | all                  | directly                   |

`ServiceCategory.requiredPlan` (relationship → `subscription-plans`) is in `commonCategoryFields`, may be set at every category level. Deepest level with `requiredPlan` set in slug path wins; fall back to ancestors if leaf is empty.

**`offer.category` is a TEXT field** (slug path, e.g. `music/dj/wedding-dj`), not a relationship. The drafting algorithm walks the slug path manually — see §5.

`User.serviceCategory` / `User.serviceCategorySlug`: meaningful only on Single tiers. Cleared when switching to Multi/Agency. The wizard's summary must communicate this clearing upfront — see §10 copy.

`User.maxOffers`: per-user limit synced from current plan on every subscription change.

⚠️ **Today's state of `maxOffers`:** Neither `checkout.session.completed` nor `customer.subscription.created` handlers write `user.maxOffers`. Active subscribers may have `maxOffers = null/undefined`. Going forward, Step 0 extensions fix this for new events. Existing users with null `maxOffers` rely on the `?? 1` fallback in [enforceMaxOffers.ts:11](../../../src/collections/Offers/hooks/enforceMaxOffers.ts) — they cannot CREATE new offers until their next Stripe webhook event auto-corrects the field. Published offers stay live. **No backfill script** — per user decision, pragmatic tradeoff.

## 3. Flow & entry points

### Step components

- **`PlanKindStep`** — Single offer vs Multi offers card picker
- **`CategoryStep`** — wraps existing `CategoryPicker`, shows resolved Single tier as live preview
- **`TierStep`** — Multi (4) vs Agency (10) card picker (Multi path only)
- **`IntervalStep`** — billing interval price list + beta option (extracted from today's inline impl)
- **`ImpactSummaryStep`** — From → To, change type, affected offers, confirmation controls

### Entry-point sequences

| Entry                          | Step sequence                                |
| ------------------------------ | -------------------------------------------- |
| Onboarding, Single             | kind → category → interval → **checkout**    |
| Onboarding, Multi              | kind → tier → interval → **checkout**        |
| "Zmień Plan", Single           | kind → category → interval → summary → confirm |
| "Zmień Plan", Multi            | kind → tier → interval → summary → confirm   |
| "Zmień kategorię" (Single only) | category → interval → summary → confirm     |
| Beta user (any entry)          | Same; Interval step offers Beta as a choice  |
| Expired sub                    | "Odnów" → onboarding sequence (unchanged)    |

"Zmień kategorię" is hidden for Multi/Agency users; the controller defensively rejects `change-category` entry when current plan is non-Single.

### Beta user variants (selection at IntervalStep)

| Current state | Selection                | Resulting action                                                                  |
| ------------- | ------------------------ | --------------------------------------------------------------------------------- |
| Beta-active   | Beta tile                | `updateBetaUserPlan` — updates user fields + runs inline drafting if downsizing   |
| Beta-active   | Paid price               | `createCheckoutSession` — converts beta to paid                                   |
| Paid-active   | Beta tile                | Not possible — Beta tile hidden when user has active paid sub                     |
| Paid-active   | Paid price               | `changePlan` → `stripe.subscriptions.update`                                      |

## 4. Server actions

> **Auth convention (every action):** First line is `const sessionUser = await getAuthenticatedUser()`. Then fetch full user via `payload.findByID` and assert role: `changePlan` and `computePlanChangeImpact` require `user.role === 'service-provider'`; `updateBetaUserPlan` requires `user.betaAccess === true`. **Never** accept `userId`, `customerId`, `subscriptionId`, or `maxOffers` from the client — all derived from session or server lookups.

### `computePlanChangeImpact({ newPlanId, intervalKey? })`

Pure read-side. **`newPriceId` is NOT accepted from client** — server resolves price from `newPlanId + intervalKey` (e.g., `'month/1'`). Prevents the "pay Agency price, get Single limits" mismatch.

Returns:

```ts
{
  changeType: 'upgrade' | 'downgrade' | 'lateral' | 'interval_only' | 'no_change',
  currentPlan: SubscriptionPlan,
  newPlan: SubscriptionPlan,
  newPrice: { id, unitAmount, currency, interval, intervalCount },
  categoryWillBeCleared: boolean,            // true if Single → Multi/Agency
  offersToDraft: {
    byCategory: { id, title, categorySlugPath }[],
    byLimit:    { id, title }[],
  },
  offersToKeepPublished: { id, title }[],
  intervalChange?: { fromLabel, toLabel },
  currencyMismatch: boolean,                 // true if new price currency != current
  hasScheduledCancel: boolean,
  isTrialing: boolean,
  trialEnd?: Date,
}
```

If `currencyMismatch`, `ImpactSummaryStep` shows error + disables Confirm. Refuses to silently render mixed-currency pricing.

### `changePlan({ newPlanId, intervalKey, categoryNames?, categorySlugs?, expectedCurrentPlanId, keepScheduledCancel })`

Renames and extends today's [`updateSubscription`](../../../src/actions/stripe/updateSubscription.ts).

**Preconditions** (throw typed errors):
- Auth role check (see top of §4).
- `getActiveSubscription` returns sub with `status in ('active', 'trialing')`. Otherwise → route to `createCheckoutSession`.
- `subscription.items.data.length === 1` else `MultipleSubscriptionItemsError`.
- `expectedCurrentPlanId` matches current resolved plan ID; otherwise `{ success: false, error: 'STALE_PLAN' }`. Null is rejected as STALE except on onboarding entry.
- Server resolves `newPriceId` from `newPlanId + intervalKey` via `stripe.prices.list({ product: newPlan.stripeID })`. Never trusts client-supplied price ID.
- Validate `categorySlugs` total stringified length < 450 chars (Stripe metadata cap is 500); each slug exists in `service-categories` collection.
- If `keepScheduledCancel === false`, the server FIRST reads `subscription.cancel_at_period_end`; only honors the clear if it's actually `true`. Prevents malicious script silently clearing user's cancellation.

**Routing:**
- **Active paid (`active`/`trialing`):** `stripe.subscriptions.update(...)` with:
  - `items: [{ id: itemId, price: serverResolvedPriceId }]`
  - `proration_behavior: changeType === 'downgrade' ? 'none' : 'create_prorations'` — preserves today's behavior (downgrades defer billing impact to period end; upgrades/lateral/interval prorate now).
  - `cancel_at_period_end: false` ONLY when current sub has `cancel_at_period_end=true` AND user opted-in via the summary checkbox; otherwise omit the field entirely.
  - `metadata: { categoryNames: JSON.stringify(categoryNames ?? []), categorySlugs: JSON.stringify(categorySlugs ?? []), planSlug: newPlan.slug, changeType }` (JSON arrays — parity with `createCheckoutSession`).
  - **Idempotency key:** `change-plan-{userId}-{subscriptionId}-{newPriceId}-{expectedCurrentPlanId ?? 'init'}` — no time component. Repeat clicks collapse; genuine re-changes have different `expectedCurrentPlanId`.

- **Write-through after successful Stripe call** (critical: `router.refresh()` races the webhook):
  - `user.maxOffers = newPlan.maxOffers`
  - `user.serviceCategory` / `serviceCategorySlug` (joined) — only when current OR new plan is Single. Multi/Agency clears both.
  - Drafting is **NOT** done in the action (offer loop can be long; leave to webhook). The webhook is authoritative for drafting; the action is authoritative for user-visible fields.

- **Beta staying beta:** delegate to `updateBetaUserPlan`.
- **Beta going paid:** delegate to `createCheckoutSession`.
- **No active sub / expired:** delegate to `createCheckoutSession`.

**Return shape** (matches `eventizer-server-actions`):
```ts
{ success: true, data: { changeType, requiresCheckoutRedirect?: boolean, checkoutUrl?: string } }
{ success: false, error: 'STALE_PLAN' | 'NO_ACTIVE_SUB' | 'MULTIPLE_ITEMS' | 'PRICE_PLAN_MISMATCH' | 'CATEGORY_INVALID' | 'CURRENCY_MISMATCH' | 'UNAUTHORIZED', message: string /* Polish */ }
```

After success: `revalidatePath('/panel/plan-subskrypcji')` + `revalidatePath('/panel/oferty')`.

Today's `updateSubscription` becomes a thin alias for backward compatibility; the alias **also derives `userId` from session** (does not accept it from caller).

### `updateBetaUserPlan({ newPlanId, intervalKey, categoryNames?, categorySlugs? })`

- Requires `user.betaAccess === true`.
- Server resolves the target plan, validates `newPlanId` exists in `subscription-plans`.
- Updates `user.maxOffers`, `serviceCategory`, `serviceCategorySlug` from resolved plan.
- **Beta loophole fix:** When `newPlan.maxOffers < currentPublishedOfferCount`, run drafting algorithm inline (Pass A + Pass B from §5) BEFORE writing fields. No webhook fires for beta.

## 5. Webhook: `customer.subscription.updated`

New handler in [`plugins/index.ts`](../../../src/plugins/index.ts). Fires immediately after `stripe.subscriptions.update`.

**Vercel runtime config:** Set `export const maxDuration = 60` on the webhook route (default 10s on Hobby is insufficient). For very large user offer counts, drafting loop should be deferred via `waitUntil()` so the handler returns 200 quickly to Stripe.

### Step 0 — Prerequisite handler extensions (must ship before this webhook)

1. Extend `checkout.session.completed` to set `user.maxOffers` from resolved plan. Today it doesn't.
2. Extend `customer.subscription.created` fallback to also set `maxOffers`.
3. Extend `checkout.session.completed` to run the drafting algorithm when a beta-to-paid conversion would exceed new plan's `maxOffers`. Closes the beta loophole for future conversions.

### Event deduplication

**Add new Payload collection `processed-stripe-events`** (fields: `eventId: string unique`, `processedAt: date`). At the top of every webhook handler, check if `event.id` exists; if so, return early. Insert after successful processing. TTL via daily cron deleting records older than 30 days. Prevents replay-based re-execution.

### Handler steps for `customer.subscription.updated`

1. Dedup check (above). Early return if seen.
2. Resolve linked user via `stripe-customers` (existing pattern; uses default `overrideAccess: true`).
3. Read current `subscriptionItem.price.id` and `subscriptionItem.price.product`.
4. **Skip if not a plan/interval change:**
   - `event.data.previous_attributes.items` absent → return.
   - Present, but previous and current `subscriptionItem.price.id` match → return.
5. Resolve `newPlan` by `subscription-plans` lookup on `stripeID = product`. **If no match: log warning, do NOT clear `maxOffers`, return.** Defensive.
6. Resolve `previousPlan` from previous price's product. If absent, treat as first plan event (no drafting).
7. Update `user.maxOffers = newPlan.maxOffers` (idempotent).
8. Update `serviceCategory` / `serviceCategorySlug`:
   - Read `JSON.parse(metadata.categorySlugs ?? '[]')`.
   - **Metadata absent AND `newPlan.maxOffers === 1`** (Billing Portal Single→Single swap): preserve existing `user.serviceCategory`. Don't clobber.
   - **`newPlan.maxOffers > 1`:** clear both fields (Multi/Agency).
   - Otherwise: set from metadata.
9. **Drafting pass** (only when `newPlan.level < previousPlan.level`):

   ```
   a. published = payload.find({ collection: 'offers', where: { user: userId, _status: 'published' }, depth: 0, limit: 0 })
   b. Collect unique category slug paths. Batch-resolve each via service-categories find + in-memory walk of subcategory_level_N arrays to deepest match.
   c. Pass A: for offer whose deepest resolved requiredPlan.level > newPlan.level → mark for drafting.
      Offers with no resolvable category or no resolvable requiredPlan → leave unaffected (defensive).
   d. Pass B: among remaining published after Pass A, sort by createdAt asc (no publishedAt field exists). Keep newPlan.maxOffers; mark rest.
   e. For each offer to draft:
        payload.update({
          collection: 'offers', id,
          data: { _status: 'draft' },
          context: { disableRevalidate: true },
        })
      After the loop, call revalidatePath('/', 'layout') ONCE. The existing revalidateFeaturedOffers hook respects the disableRevalidate context flag.
   f. Log: structured entry with eventId, subscriptionId, userId, prevLevel→newLevel, draftedByPassA count, draftedByPassB count. Never log full event/subscription objects (PII).
   ```

10. **Drafting always reads current `_status: 'published'` from Payload**, never from `event.data.object`. This is what makes state-based idempotency safe under out-of-order delivery.
11. Persist `event.id` to `processed-stripe-events`.

### Idempotency

State-based + event-id deduplication. Sufficient given:
- `payload.update` to already-set values is a no-op.
- Drafting offers already drafted is a no-op.
- "Keep N oldest by `createdAt`" is deterministic and reads current state.
- We only draft, never republish (upgrades don't reverse drafts).
- Event-ID store catches Stripe at-least-once retries.

### What stays untouched

- `createCheckoutSession`, `activateBetaAccess`, `createBillingPortalSession`
- `customer.subscription.deleted` webhook
- `enforceMaxOffers` hook on Offer create (with §13 policy fix)

## 6. Edge cases

| #  | Case                                                       | Handling                                                                                                                                                                                       |
| -- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Same plan + same interval (no-op)                          | `'no_change'`. Confirm disabled.                                                                                                                                                                |
| 2  | Same plan, different interval                              | `'interval_only'`. No offers affected.                                                                                                                                                          |
| 3  | Lateral within tier                                        | Same as #2.                                                                                                                                                                                     |
| 4  | Beta staying beta with new tier                            | `updateBetaUserPlan`. Inline drafting if downsizing (no webhook).                                                                                                                               |
| 5  | Beta picking paid                                          | `createCheckoutSession`. Step 0's extended `checkout.session.completed` handler sets `maxOffers` AND runs drafting if needed.                                                                  |
| 6  | Multi/Agency opens "Zmień kategorię"                       | Button hidden; controller defensively rejects.                                                                                                                                                  |
| 7  | `cancel_at_period_end = true`                              | Summary shows checkbox `Tak, anuluj zaplanowane wygaśnięcie subskrypcji` (default UNCHECKED). Server cross-checks subscription state before honoring; only passes `cancel_at_period_end: false` when both flags align. |
| 8  | Expired subscription, "Zmień Plan"                         | Buttons gated on `isActive`. Expired → "Odnów" → onboarding.                                                                                                                                    |
| 9  | Currently-drafted offers                                   | Not touched on any plan change — no auto-republish on upgrade.                                                                                                                                  |
| 10 | Race: user publishes new offer between confirm and webhook | Webhook recomputes from current state. Preview is best-effort.                                                                                                                                  |
| 11 | Failure mid-drafting                                       | Each `payload.update` independent. Stripe retries via event-ID dedup-safe replay. v1 accepts non-transactional; transactional via `payload.db.beginTransaction()` is a follow-up.              |
| 12 | Plan deleted in Stripe mid-wizard                          | `resolvePlanFromSelection` returns null → wizard surfaces toast and exits.                                                                                                                      |
| 13 | Concurrent tabs                                            | `expectedCurrentPlanId` optimistic concurrency. `STALE_PLAN` → "Plan zmienił się w innej karcie. Odświeżamy stronę…"                                                                            |
| 14 | Stripe Billing Portal bypass                               | Webhook preserves `serviceCategory` when metadata absent AND new plan is Single. **Stripe Dashboard Portal config** must whitelist only the 5 production prices (rollout step).                |
| 15 | Webhook delayed/failed                                     | Action's write-through covers user-visible state. Drafting reconciles on next webhook. Permanent failure → admin `payload-reconcile-subscriptions` task (follow-up).                            |
| 16 | Currency mismatch                                          | `currencyMismatch: true` → Summary shows error, disables Confirm, offers "Skontaktuj się z pomocą" mailto.                                                                                      |
| 17 | Trial-period subscription                                  | Precondition accepts `trialing`. Stripe preserves `trial_end`. Summary shows trial banner.                                                                                                      |
| 18 | Admin edits `requiredPlan` between preview and webhook     | Webhook re-evaluates. Generic success toast: "Zmiana planu została zlecona. Wkrótce zobaczysz aktualny status w sekcji oferty." Don't promise specific count.                                  |
| 19 | User has drafts at downgrade time                          | `enforceMaxOffers` policy change (§13 option a) — count only published. Drafts no longer block creation.                                                                                        |
| 20 | `incomplete` / `past_due` subscription                     | Precondition rejects; UI guides user to billing portal to resolve payment.                                                                                                                      |
| 21 | Stripe product without matching Payload plan               | Webhook logs warning, returns. `computePlanChangeImpact` returns error; UI disables Confirm with "Plan niezsynchronizowany — skontaktuj się z administratorem."                                |
| 22 | Offer with deleted/missing category                        | Pass A leaves it untouched (defensive). Pass B can still draft it if over limit.                                                                                                                |
| 23 | Out-of-order webhook delivery / retried events             | Event-ID dedup store rejects duplicates. State-based drafting converges.                                                                                                                        |
| 24 | `customer.subscription.updated` before `created`           | Handler gracefully no-ops if user link not found (existing pattern).                                                                                                                            |

## 7. Component structure

```
src/components/panel/plan-subskrypcji/
├── SubscriptionManager.tsx              # Status view + entry buttons (~150 lines)
├── SubscriptionWizard.tsx               # Controller (FormProvider + RHF) (~150 lines)
├── steps/
│   ├── PlanKindStep.tsx
│   ├── CategoryStep.tsx
│   ├── TierStep.tsx
│   ├── IntervalStep.tsx
│   └── ImpactSummaryStep.tsx
└── lib/
    ├── planChangeSchema.ts              # Zod schema + WizardFormData type
    ├── resolvePlanFromSelection.ts      # ({kind, category?, tierSlug?}) → SubscriptionPlan
    ├── wizardSequence.ts                # (entry, kind) → ordered step list
    └── pluralizeOffers.ts               # Polish noun declension helper

src/lib/subscriptions/
└── draftOffersOnDowngrade.ts            # Extracted drafting algorithm (Pass A + Pass B); shared by webhook + updateBetaUserPlan + checkout handler

src/actions/stripe/
├── changePlan.ts                        # NEW
├── computePlanChangeImpact.ts           # NEW
├── updateBetaUserPlan.ts                # NEW (inline drafting)
└── updateSubscription.ts                # Thin alias

src/collections/
└── ProcessedStripeEvents.ts             # NEW — event-ID dedup + audit (eventId, userId, subscriptionId, prevPlanSlug, newPlanSlug, prevLevel, newLevel, draftedByCategory, draftedByLimit, processedAt)

src/plugins/index.ts                     # Add customer.subscription.updated; extend checkout.session.completed; extend customer.subscription.created

src/collections/Offers/hooks/enforceMaxOffers.ts  # §13 fix: count _status='published' only

src/app/api/cron/                        # Daily cron job
└── purge-stripe-events/route.ts         # Delete processed-stripe-events older than 30d
```

### Wizard state (react-hook-form)

Matches `OfferWizardForm` pattern (recent commit `24eba48` wrapped steps in FormProvider so step children can `useFormContext()`):

```ts
const form = useForm<WizardFormData>({
  resolver: zodResolver(planChangeSchema),
  defaultValues: { selectedKind: undefined, selectedCategoryPath: undefined, ... },
})
<FormProvider {...form}>
  <WizardStepIndicator steps={...} currentStepId={...} onStepClick={...} />
  <CurrentStep />
</FormProvider>
```

Reuse [`WizardStepIndicator`](../../../src/components/panel/wizard/WizardStepIndicator.tsx) (variable-length step arrays + click-to-jump) and `PanelPageHeader.progress` for top bar. Do not hand-roll progress UI.

When user navigates back and changes `selectedKind`, downstream fields (`selectedCategoryPath`, `selectedTierSlug`, `selectedPriceId`) are reset via `form.resetField()` per field.

### `SubscriptionWizard` props

```ts
{
  entry: 'onboarding' | 'change-plan' | 'change-category'
  user: User
  subscription: CurrentSubscriptionDetails
  categories: ServiceCategory[]
  lang: string
  showBetaOption: boolean
  onExit: () => void
}
```

`wizardSequence(entry, kind)` returns the ordered step list.

### Per-step shape

Steps consume `useFormContext<WizardFormData>()`. Async data loaded inside step with loading states colocated. Skeleton placeholders match final layout (no spinner-flash + layout shift).

### Browser back-button warning

When wizard is past step 1 with dirty form state, attach a `beforeunload` listener: "Czy na pewno chcesz wyjść? Niezapisane zmiany zostaną utracone."

### Confirm wiring

```ts
function handleConfirm() {
  // Synchronous lock before transition starts — prevents idempotency-key edge case
  setIsLocked(true)
  startTransition(async () => {
    const result = await changePlan({
      newPlanId,
      intervalKey,
      categoryNames,
      categorySlugs,
      expectedCurrentPlanId: subscription.currentPlan?.id,
      keepScheduledCancel: form.getValues('keepScheduledCancel'),
    })
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
```

For downgrade and currency-change paths, wrap Confirm in an `AlertDialog`:
> "Czy na pewno chcesz zmienić plan? **{N} ofert zostanie przeniesionych do wersji roboczych.** Tej akcji nie można cofnąć z poziomu panelu."

### Routing

Wizard lives as a mode of `/panel/plan-subskrypcji` (no subroute). State ephemeral. Wizard renders under `PanelPageHeader`.

## 8. Onboarding (changes for new users)

Onboarding gains `PlanKindStep` as first step. New users can pick Multi/Agency directly.

- Single → CategoryStep → IntervalStep → checkout
- Multi → TierStep → IntervalStep → checkout

`createCheckoutSession` unchanged. Multi/Agency invocations pass empty `categoryNames`/`categorySlugs`. Step 0's extended `checkout.session.completed` sets `maxOffers`.

## 9. Design tokens & accessibility

Per `eventizer-design-tokens` and `web-accessibility`:

### Visual

- Step card pickers (`PlanKindStep`, `TierStep`): hover-tint from `SubscriptionManager.tsx:271-275`:
  - selected: `border-accent bg-accent/5`
  - default + hover: `border-border hover:border-accent/30`
- Tier headlines: `font-bebas tracking-wide`; body: Montserrat
- Selection state conveyed by **border + accent CheckIcon** (matching `SubscriptionManager.tsx:282`), not just background tint (5% accent fails WCAG 1.4.11 on its own)
- Motion: `motion/react` with `MotionConfig reducedMotion="user"`
  - Reduced motion disables: card hover scale, AnimatedCard entrance spring, progress-bar transition
  - Keeps: instant color/border state changes (not motion)
- Mobile: `grid-cols-1 sm:grid-cols-2` for card layouts; affected-offer list `max-h-96 overflow-y-auto`; Back/Next stay `flex justify-between`

### Accessibility

- **Card pickers:** `<button role="radio" aria-checked={isSelected}>` inside `<div role="radiogroup" aria-labelledby="step-heading">`. Arrow-key navigation between cards. `tabIndex={isSelected ? 0 : -1}` so the group is one tab stop. `focus-visible:ring-2 focus-visible:ring-accent`.
- **Step indicator:** `<nav aria-label="Postęp kreatora">` wrapping `WizardStepIndicator`. Active step `aria-current="step"`. Completed steps `aria-label="Krok N z M: {label}, ukończony"`.
- **Impact summary list:** `<ul>` semantics; cap visible items at 10 with "Pokaż wszystkie ({N})" disclosure.
- **Form errors:** RHF + zod errors render in `aria-live="polite"`. On step change, step heading receives `tabIndex={-1}` + `ref.focus()` so screen-reader users land in context.
- **Progress bar:** verify shadcn `Progress` emits `role="progressbar"` and add `aria-valuetext="Krok N z M"`.

## 10. Localization — Polish copy

All strings verbatim, ready to drop in:

### PlanKindStep

- Heading: **„Wybierz typ planu"**
- Subheading: „Zdecyduj, czy oferujesz jedną usługę, czy chcesz publikować ich więcej."
- Card 1 label: **„Pojedyncza oferta"**
- Card 1 description: „Idealne, jeśli świadczysz jeden rodzaj usługi i prowadzisz jedną wizytówkę."
- Card 2 label: **„Wiele ofert"**
- Card 2 description: „Publikuj kilka ofert pod jednym kontem — przydatne dla agencji i wielobranżowych firm."
- Next: **„Dalej"**

### CategoryStep

- Heading: **„Wybierz swoją kategorię usług"**
- Subheading: „Od wybranej kategorii zależy plan subskrypcji i jego cena."
- Live preview: „Plan: **{planName}**"
- Empty preview: „Wybierz kategorię, aby zobaczyć dopasowany plan."
- Next/Back: **„Dalej"** / **„Wstecz"**

### TierStep

- Heading: **„Wybierz pakiet"**
- Subheading: „Każdy pakiet różni się limitem ofert i zakresem kategorii."
- Multi label: **„Multi — do 4 ofert"**
- Multi desc: „Publikuj do czterech ofert w dowolnych kategoriach."
- Agency label: **„Agency — do 10 ofert"**
- Agency desc: „Najwyższy limit ofert — wybór agencji i większych firm."
- Next/Back: **„Dalej"** / **„Wstecz"**

### IntervalStep

- Heading: **„Wybierz okres rozliczeniowy"**
- Subheading: „Plan: **{planName}** — wybierz, jak często chcesz być rozliczany."
- Interval labels: `month/1` → „Miesięcznie", `month/6` → „Co 6 miesięcy", `year/1` → „Rocznie"
- Discount badge: „Oszczędzasz **{X}%**"
- Beta tile: **„Dostęp Beta"** + badge „Za darmo"
- Beta tooltip: „Bezpłatny dostęp testowy z pełną funkcjonalnością wybranego pakietu. Dostępne tylko dla zaproszonych użytkowników."

### ImpactSummaryStep — banners

- Heading: **„Podsumowanie zmiany planu"**
- From → To: „Z planu **{old}** ({oldInterval}) na **{new}** ({newInterval})"
- Single→Multi clearing note: „Po przejściu na plan {Multi/Agency} Twoja kategoria zostanie usunięta z profilu — będziesz mógł oferować usługi we wszystkich kategoriach."
- Upgrade: „**Świetnie!** Po zmianie planu będziesz mógł opublikować dodatkowo **{N}** {pluralize: ofertę/oferty/ofert}."
- Downgrade — category-only: „**Uwaga:** {pluralize: Twoja oferta zostanie przeniesiona / Twoje N oferty zostaną przeniesione / Twoich N ofert zostanie przeniesionych} do wersji roboczych, ponieważ kategoria nie jest dostępna w planie **{new}**."
- Downgrade — limit overflow: „**Uwaga:** nowy plan **{new}** pozwala opublikować maksymalnie **{maxOffers}** {pluralize: ofertę/oferty/ofert}. {N} {pluralize ... } zostanie przeniesion{a/e/ych} do wersji roboczych — zachowamy {maxOffers} najstarsz{ą/e/ych}."
- Downgrade — both reasons: combined wording per UX spec.
- No-change: „**Nic do zmiany.** Wybrany plan i okres rozliczeniowy są takie same jak obecny."
- Interval-only: „Zmieniasz okres rozliczeniowy z **{from}** na **{to}**. Twoje oferty pozostają bez zmian."
- Trial banner: „Korzystasz z okresu próbnego do **{date}**. Zmiana planu nie przerywa tego okresu — opłata zostanie pobrana po jego zakończeniu."
- Empty list: „Nie masz aktualnie publikowanych ofert — zmiana planu nie wpływa na żadne treści."

### ImpactSummaryStep — controls

- Scheduled-cancel checkbox: **„Tak, anuluj zaplanowane wygaśnięcie subskrypcji"**
- Cancel explanation: „Twoja subskrypcja jest obecnie ustawiona na wygaśnięcie {date}. Zaznacz, aby zmiana planu jednocześnie cofnęła zaplanowane wygaśnięcie."
- Confirm — upgrade: **„Zmień plan i zapłać teraz"**
- Confirm — downgrade: **„Potwierdź zmianę planu"**
- Confirm — interval-only: **„Zmień okres rozliczeniowy"**
- Confirm — lateral: **„Potwierdź zmianę"**
- Confirm — no-change (disabled): **„Brak zmian do zapisania"**
- AlertDialog confirmation (downgrade only): „Czy na pewno chcesz zmienić plan? **{N pluralized}** zostanie przeniesion{a/e/ych} do wersji roboczych. Tej akcji nie można cofnąć z poziomu panelu."

### Errors / toasts

- Currency mismatch: „**Nie możemy zmienić planu w tym momencie.** Wybrana cena jest w innej walucie ({newCur}) niż Twoja obecna subskrypcja ({oldCur}). Skontaktuj się z pomocą techniczną." + button „Skontaktuj się z pomocą" (`mailto:` with prefilled subject)
- STALE_PLAN: „Plan zmienił się w innej karcie. Odświeżamy stronę…"
- Price-load error: „Nie udało się załadować cen. Spróbuj odświeżyć stronę." + retry button
- Impact-compute error: „Nie udało się obliczyć skutków zmiany planu." + retry button
- Plan-out-of-sync: „Plan niezsynchronizowany — skontaktuj się z administratorem."
- Success: „Zmiana planu została zlecona. Wkrótce zobaczysz aktualny status w sekcji oferty."

### Affected offer item format

- Title (bold) · status badge „Wersja robocza" · reason badge „Kategoria spoza planu" or „Limit ofert"

### Polish noun declension (`pluralizeOffers` helper)

For count N:
- `N === 1` → "1 oferta zostanie przeniesiona"
- `N` ends in 2/3/4 AND not in 12/13/14 → "{N} oferty zostaną przeniesione"
- All others (0, 5+, 11–14) → "{N} ofert zostanie przeniesionych"

Implement as `src/components/panel/plan-subskrypcji/lib/pluralizeOffers.ts` with signature `{ count, verb, participle, noun }`.

## 11. Migration & rollout

### 11.1 Code deploys (in order)

1. **Drafting helper extraction** (`src/lib/subscriptions/draftOffersOnDowngrade.ts`) + unit tests. No behavior change. Safe to merge alone.
2. **`ProcessedStripeEvents` collection** + dedup helper. No handler uses it yet.
3. **Extend `checkout.session.completed` and `customer.subscription.created`** to set `user.maxOffers`. Additive only.
4. **Extend `checkout.session.completed`** to run drafting helper on beta-to-paid when needed.
5. **`enforceMaxOffers`** policy fix per §13 (filter `_status: 'published'`).
6. **`customer.subscription.updated`** handler + `maxDuration = 60`.
7. **Server actions:** `computePlanChangeImpact`, `updateBetaUserPlan`, `changePlan`. Old `updateSubscription` becomes thin alias.
8. **Wizard UI:** `IntervalStep` extraction → `PlanKindStep`/`TierStep`/`SubscriptionWizard` → onboarding rewire → `ImpactSummaryStep` + "Zmień Plan" wiring.
9. **Daily cron** `purge-stripe-events` (delete records older than 30d).

Each step lands as an independent PR. All ship to 100% (no staged rollout / feature flag).

### 11.2 Stripe Dashboard configuration

Required, manual, per environment (test + production):

1. **Enable webhook event `customer.subscription.updated`** on the existing webhook endpoint. Test via Stripe CLI `stripe trigger customer.subscription.updated`. Verify 200 response.
2. **Configure Stripe Billing Portal product list** to whitelist only the 5 production plans/prices. Prevents user from switching to internal/test plans via the Portal.
3. Snapshot Portal config ID + pin in env var `STRIPE_BILLING_PORTAL_CONFIG_ID`.

### 11.3 No backfill — fallback strategy

Per user decision: no `user.maxOffers` backfill script. Existing users with null `maxOffers` rely on:
- `enforceMaxOffers.ts:11` already does `req.user.maxOffers ?? MAX_OFFERS_PER_USER` (= 1).
- `SubscriptionPlans.ts:113` has `defaultValue: 1` on the field.

**Practical implication:** existing Multi/Agency users with null `maxOffers` cannot CREATE new offers until their next Stripe event (renewal, plan change, etc.) auto-corrects the field via the Step 0 handler extensions. Their existing published offers stay live. Acceptable tradeoff.

**One-time mitigation for the Multi/Agency cohort** (optional, if customer complaints): trigger a no-op `customer.subscription.updated` event for each affected user via Stripe Dashboard's "Resend webhook" button on a recent event. Spec §16 leaves this as operational, not code work.

### 11.4 Rollout sequence

Single linear sequence — ship each PR to main, merge to production, no flags or canaries:

1. Land code (PRs 1–9 from §11.1, in order or batched parallel per §17 work-unit graph).
2. After PR 6 lands: enable `customer.subscription.updated` event in Stripe Dashboard (test + prod).
3. After PR 8 lands: configure Stripe Billing Portal product whitelist (test + prod).
4. Smoke-test in production with a personal account.

### 11.5 Rollback

| Failure                            | Mitigation                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| UI bug                             | Revert the UI PR (single Vercel deploy revert).                                                       |
| Webhook handler bug                | Revert handler PR. The `ProcessedStripeEvents` audit table records every event processed — query it to find affected users; manually flip drafted offers back to published if needed. |
| Stripe Dashboard misconfig         | Disable problematic event subscription; investigate logs.                                              |

### 11.6 Validation

After deploy:

1. Smoke-test: own account walks the new wizard end-to-end (upgrade, downgrade, change-category, beta if applicable).
2. SQL: count of `ProcessedStripeEvents` after 24 hours > 0 (proves the new handler is being hit).
3. Log scan: no ERROR-level logs from `customer.subscription.updated` handler.
4. Customer complaint monitoring for a week.

## 12. Testing

Concrete scenarios (mapped to spec sections):

- **Unit — `pluralizeOffers`:** 0, 1, 2, 5, 12, 22, 25 → verify each case.
- **Unit — `draftOffersOnDowngrade` (shared helper):** Pass A only, Pass B only, both, offers with deleted/missing category, ties in `createdAt`.
- **Unit — `computePlanChangeImpact`:** every `changeType`, currency mismatch, missing `previousPlan`, `expectedCurrentPlanId` mismatch.
- **Unit — `resolvePlanFromSelection`:** every (kind, category?, tierSlug?) permutation.
- **Unit — `wizardSequence`:** every (entry, kind) combo.
- **Webhook — `customer.subscription.updated`:**
  - Upgrade (no drafting); downgrade with category violations; downgrade with limit overflow; downgrade with both; interval-only (early return); metadata-only (early return); out-of-order delivery; idempotent replay (event-ID dedup); Stripe Portal–originated (no metadata); product without Payload plan (warns + returns).
- **Integration — `changePlan`:** STALE_PLAN rejection; `proration_behavior` per direction; `cancel_at_period_end` conditional handling; idempotency-key dedup; metadata as JSON arrays; server-resolved `newPriceId`; auth rejection for non-service-provider.
- **Integration — Wizard controller:** step nav, back/forward, RHF validation, `resetField` on kind change, `beforeunload` warning.
- **E2E (Playwright):** upgrade happy path; downgrade with drafting; change category; beta-stay-beta; beta-go-paid; concurrent-tab STALE_PLAN; mobile (375px viewport).
- **A11y:** axe-core checks on each step; keyboard-only flow through full wizard.

## 13. §13 Open decision — `enforceMaxOffers` counting policy

**Recommendation: Option (a)** — revise `enforceMaxOffers` hook to filter `where: { _status: { equals: 'published' } }`. Drafts no longer count toward the limit.

Rationale: Drafts are private workspace. Counting them toward a public-listing limit is unintuitive and creates a stuck-state after downgrade. The user has confirmed they want drafts to be unaffected on plan changes (§Q4b).

Alternatives:
- (b) Keep current behavior, surface explanatory banner — friendlier than (c) but adds chrome.
- (c) Webhook deletes drafts beyond limit — destructive, not recommended.

Adopt (a) unless user objects.

## 14. Observability

New structured logs + alerts:

| Signal                                  | Implementation                                                               | Alert threshold                                |
| --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- |
| Webhook success/error rate              | Structured log `event=webhook.customer.subscription.updated status=ok|err`   | Error rate >5% over 5 min                       |
| Drafting count anomaly                  | Log `event=drafting.completed drafted=N`                                     | N > 5 on single event (max legit is 9 = T5→T1) |
| `maxOffers IS NULL` count               | Daily Vercel cron runs SQL count                                             | non-zero                                       |
| `changePlan` action error breakdown     | Structured log grouped by `error` field                                      | Spike in STALE_PLAN, MULTIPLE_ITEMS, etc.     |
| Webhook lag                             | `Date.now() - event.created * 1000`                                          | p95 > 5s                                       |
| Audit table                             | `subscription-events` collection: eventId, userId, prevLevel, newLevel, ts   | Dashboard for human reconciliation             |

## 15. Out of scope

- Letting user pick which specific offers stay published on downgrade
- Auto-republishing offers on upgrade
- Pro-rated invoice preview UI
- Subscription schedules / true period-end deferral (we use `proration_behavior: 'none'` for downgrades)
- Per-tier custom proration overrides
- Transactional Payload writes for drafting (idempotency-via-retry is the contract for v1)
- Admin tool to manually reconcile a user's subscription with Stripe (follow-up)
- Reverse-direction migration (downgrading the audit/dedup tables back)

## 16. Decisions locked

User-confirmed during planning:

1. **§13 — `enforceMaxOffers` policy:** Option (a) — count only `_status: 'published'`.
2. **UX — Group entry points** into a single "Zarządzaj subskrypcją" dropdown with three items: „Zmień plan…", „Zmień kategorię…", „Zarządzaj płatnościami…".
3. **No staged rollout / no feature flag** — ship to 100% on each PR merge.
4. **AlertDialog before destructive downgrade** — keep.
5. **No backfill script** — rely on `?? 1` fallback (§11.3).
6. **`ProcessedStripeEvents` collection** — single collection for dedup + audit (combined fields).
