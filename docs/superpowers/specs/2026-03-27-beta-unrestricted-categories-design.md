# Beta Users Get Unrestricted Category Access

**Date:** 2026-03-27
**Approach:** A — Extend the existing `effectivePlanLevel` check

## Context

Beta access was added to bypass Stripe checkout entirely. Users with `betaAccess: true` are treated as having an active subscription (`getCurrentSubscriptionDetails` returns `{ hasSubscription: true, isBetaUser: true }`). However, category availability is still gated by subscription plan level — beta users get whatever their (nonexistent) plan maps to, likely level 0. This means beta users see most categories as locked.

Admins already bypass this via `effectivePlanLevel = Number.MAX_SAFE_INTEGER`. Beta users should get the same treatment.

## Changes

### 1. `src/actions/getOfferCategories.ts` (lines 193-194)

Expand the unrestricted check from admin-only to admin OR beta:

```ts
const isUnrestricted = user.role === 'admin' || user.betaAccess === true
const effectivePlanLevel = isUnrestricted ? Number.MAX_SAFE_INTEGER : userPlan.level
const effectivePlanName = isUnrestricted
  ? (user.role === 'admin' ? 'Admin (unrestricted)' : 'Beta (unrestricted)')
  : userPlan.name
```

This affects both onboarding category selection and offer creation/editing — they all go through `getOfferCategories()`.

### 2. `src/collections/Offers/hooks/validateCategory.ts` (lines 7-10)

Add beta bypass to the server-side validation hook:

```ts
if (isClientRoleEqualOrHigher('moderator', req.user) || req.user.betaAccess === true) {
  return data
}
```

Without this, beta users could see all categories in the UI but get rejected server-side when creating an offer in a category their plan level doesn't cover.

## What doesn't change

- **Beta activation flow** (`activateBetaAccess.ts`) — unchanged
- **Subscription detection** (`getCurrentSubscriptionDetails.ts`) — already returns `isBetaUser: true`
- **Onboarding UI** — already renders whatever `getOfferCategories` returns
- **Admin behavior** — unchanged, still `MAX_SAFE_INTEGER`
- **Offer limit enforcement** — separate from categories, unchanged

## Scope

2 files, ~4 lines changed. No new dependencies, no schema changes, no UI changes.
