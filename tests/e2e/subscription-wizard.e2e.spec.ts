// tests/e2e/subscription-wizard.e2e.spec.ts
import { test } from '@playwright/test'

/**
 * E2E tests for the subscription plan change wizard.
 *
 * STATUS: Skeleton (test.skip placeholders). To enable these tests, the project needs:
 *   1. A test user fixture system — ability to create users with various subscription states
 *      (no-sub, single-tier-active, multi-tier-active, beta-active, cancel-at-period-end, trialing)
 *   2. Stripe test-mode integration — either real Stripe test prices/products OR a MSW-style mock
 *      that intercepts calls in tests/e2e/_setup
 *   3. Auth automation — programmatic login (Better Auth has a sign-in endpoint; use it to obtain
 *      a session cookie and reuse it via storageState)
 *   4. DB seeding — published offers in various categories for downgrade-drafting tests
 *
 * The scenarios below are derived from spec §12 "Testing — E2E happy paths" and locked decisions.
 *
 * NOTE: test.todo() is not available in Playwright 1.x. Each test uses test.skip(true, 'not implemented')
 * so the runner reports them as skipped/pending without executing any logic.
 */

// ---------------------------------------------------------------------------
// Helper — marks a test as pending (todo) without executing it.
// Replace `const TODO = 'not implemented'` with real fixtures when scaffolding.
// ---------------------------------------------------------------------------
const TODO = 'not implemented — see file header for required scaffolding'

test.describe('Subscription wizard — onboarding', () => {
  test('Single path completes to Stripe Checkout — picks Pojedyncza oferta, picks category, picks Miesięcznie, click Przejdź do płatności → redirects to checkout.stripe.com', async () => {
    test.skip(true, TODO)
  })

  test('Multi path completes to Stripe Checkout — picks Wiele ofert, picks Multi (4 oferty), picks Rocznie, click Przejdź → checkout', async () => {
    test.skip(true, TODO)
  })

  test('Multi path with Agency tier — same as above but selects Agency, verifies higher price displayed', async () => {
    test.skip(true, TODO)
  })

  test('Browser-back warning when wizard is dirty past step 1 — picks kind, navigates back via browser, beforeunload confirm appears', async () => {
    test.skip(true, TODO)
  })
})

test.describe('Subscription wizard — change plan (existing single-tier sub)', () => {
  test('Upgrade Single → Multi — picks Wiele ofert → Multi → interval → summary shows "upgrade" banner → Confirm shows no AlertDialog → success toast', async () => {
    test.skip(true, TODO)
  })

  test('Lateral interval change — picks same plan but different interval → summary shows "interval_only" banner → Confirm without AlertDialog', async () => {
    test.skip(true, TODO)
  })

  test('No-change — re-picks same plan + same interval → summary shows "Nic do zmiany" banner, Confirm disabled', async () => {
    test.skip(true, TODO)
  })

  test('Single → Single+ via category change — picks higher-tier category → summary shows upgrade, plan transition visible', async () => {
    test.skip(true, TODO)
  })
})

test.describe('Subscription wizard — change plan (existing multi-tier sub) — destructive', () => {
  test('Downgrade Multi → Single with 3 published offers, all category-compatible — summary shows "2 oferty zostaną przeniesione do wersji roboczych" — AlertDialog appears on Confirm → click Potwierdź → success', async () => {
    test.skip(true, TODO)
  })

  test('Downgrade Multi → Single with mixed-category offers — summary lists offers grouped by reason (Kategoria spoza planu vs Limit ofert)', async () => {
    test.skip(true, TODO)
  })

  test('Agency → Multi (10 → 4) — drafts 6+ offers, AlertDialog gate, success', async () => {
    test.skip(true, TODO)
  })

  test('Currency mismatch — when current price PLN and new price EUR (artificial scenario), summary shows error and disables Confirm', async () => {
    test.skip(true, TODO)
  })
})

test.describe('Subscription wizard — change category (Single users only)', () => {
  test('Single user picks new category that maps to same plan tier — interval-only equivalent, no offers affected', async () => {
    test.skip(true, TODO)
  })

  test('Single user picks new category that maps to higher tier — upgrade flow with summary', async () => {
    test.skip(true, TODO)
  })

  test('Multi/Agency user does NOT see "Zmień kategorię" dropdown item', async () => {
    test.skip(true, TODO)
  })
})

test.describe('Subscription wizard — beta users', () => {
  test('Beta user changes plan via wizard, picks Beta interval again — updateBetaUserPlan flow, no Stripe call', async () => {
    test.skip(true, TODO)
  })

  test('Beta user with excess maxOffers downsizes plan → drafting runs inline', async () => {
    test.skip(true, TODO)
  })

  test('Beta user picks paid interval → routes to createCheckoutSession (new subscription)', async () => {
    test.skip(true, TODO)
  })
})

test.describe('Subscription wizard — edge cases', () => {
  test('Concurrent tabs STALE_PLAN — Tab A changes plan, Tab B tries to change → STALE_PLAN toast appears, router refresh', async () => {
    test.skip(true, TODO)
  })

  test('Scheduled cancel checkbox — user with cancel_at_period_end=true sees checkbox, default unchecked, opting in passes keepScheduledCancel=false', async () => {
    test.skip(true, TODO)
  })

  test('Trial period banner — user with subscription.status=trialing sees Okres próbny banner with date', async () => {
    test.skip(true, TODO)
  })

  test('Mobile viewport 375px — card pickers stack vertically, Back/Next stay side-by-side, summary list scrolls within max-h', async () => {
    test.skip(true, TODO)
  })

  test('Keyboard navigation — Tab through wizard, arrow keys move between cards in radiogroup, Enter submits', async () => {
    test.skip(true, TODO)
  })
})
