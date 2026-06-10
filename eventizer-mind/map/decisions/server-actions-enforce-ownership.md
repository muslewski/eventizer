---
type: decision
summary: "Server actions that call Payload with overrideAccess: true must enforce session + ownership in-action (assertOfferOwnership pattern); the collection access layer cannot protect a bypassed call."
tags: [security, actions, offers, access]
status: active
created: 2026-06-10
updated: 2026-06-10
related: ["[[offer-wizard]]", "[[offers-data]]", "[[auth]]"]
sources: []
decided: 2026-06-10
supersededBy: ""
---

# Ownership is enforced in-action, not assumed from the caller

## Context
The offer server actions (`src/actions/panel/offers.ts`) call the Payload local API with
`overrideAccess: true` — necessary because providers must write their own drafts, which the
collection rules would otherwise restrict. Until 2026-06-10, `updateOffer` and
`toggleOfferStatus` authenticated the session but *assumed* the caller owned the offer
(a code comment literally said so), and `getOffers`/`getOffer` accepted a `userId` parameter
with no session check at all. Server actions are network-callable POST endpoints: any
authenticated user could mutate any offer by id, and unauthenticated callers could enumerate
any user's drafts (user ids are sequential integers). `deleteOffer` already did the check
correctly — the pattern existed in the same file.

## Decision
Every action that overrides access enforces authorization itself, before the Payload call:

1. `getAuthenticatedUser()` — reject unauthenticated callers.
2. `getFullUser()` — load the Payload user; the session user may lack a fresh `role`.
3. `assertOfferOwnership(payload, offerId, user)` — owner or moderator+ (admin-views-provider),
   handling both populated-object and scalar `user` relationship shapes.
4. Read actions derive the target user from the session; only moderator+ may pass a foreign
   `userId` (preserves the admin-views-provider feature).
5. The incoming `user` field is stripped from update payloads — reassignment is admin-UI
   territory.
6. Publish-limit checks count the **offer owner's** quota, not the caller's, so a moderator
   publishing on someone's behalf bills the right account.

Regression-tested in `tests/int/actions/offers.int.spec.ts` (red→green, 10 tests).

## Consequences
- `overrideAccess: true` is only legitimate *after* an explicit in-action check — this is now
  an invariant on [[offer-wizard]] and matches the guidance in the eventizer-server-actions
  skill ("when you do override, validate ownership/role yourself").
- New mutations on owned resources should reuse `assertOfferOwnership` / the same shape rather
  than re-deriving ownership ad hoc.
