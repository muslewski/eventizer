---
type: debt
summary: "No automated test guards the admin → moderator → service-provider/client role hierarchy enforced by the access-control factories."
tags: [auth, access, testing]
status: open
created: 2026-06-02
updated: 2026-06-10
related: ["[[auth]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
severity: med
effort: med
---

# Access-control role hierarchy has no test

## What
The role hierarchy (admin → moderator → service-provider/client) is enforced at runtime by the
`roleOrHigher` / `roleOrHigherOrSelf` / `providerOrHigher` factories in `src/access/`, but no
integration test asserts that each factory grants/denies the right roles. The `auth` zone card
lists this invariant with an empty `enforcedBy`, so `pnpm mind:check` reports it as a gap.

## Risk
A refactor of the access factories (or a role-name change) could silently weaken authorization —
e.g. a `client` gaining provider-only access — with nothing catching it in CI/tests.

## Fix sketch
Add `tests/int/access/role-hierarchy.int.spec.ts` exercising each factory against each role, then
set the `auth` zone invariant's `enforcedBy` to `["[[test:role-hierarchy.int]]"]`.

## Progress (2026-06-10)
Adjacent access behavior is now regression-tested — `tests/int/access/offersReadAccess.int.spec.ts`
(anon = published only), `tests/int/access/uploadCreateAccess.int.spec.ts` (create requires auth),
and `tests/int/actions/offers.int.spec.ts` (action-level ownership; see
[[server-actions-enforce-ownership]]). The factories themselves (`roleOrHigher` & co.) remain
untested, so this note and the auth-zone gap stay open.
