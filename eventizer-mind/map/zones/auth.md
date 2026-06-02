---
type: zone
summary: "Better Auth (OAuth + email/password) sessions synced to a Payload Users collection; role hierarchy and access-control factories."
tags: [auth, roles, access]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[better-auth-payload-user-sync]]", "[[access-control-test-coverage]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: ["/auth"]
  anchors: ["symbol:roleOrHigher"]
  globs:
    - "src/auth/**"
    - "src/collections/auth/**"
    - "src/app/(frontend)/[lang]/auth/**"
    - "src/app/api/auth/**"
    - "src/access/**"
depends: []
invariants:
  - rule: "Role hierarchy admin → moderator → service-provider/client is enforced via roleOrHigher / *OrSelf access factories."
    enforcedBy: []
verifiedAt: "32f283812d0ecc55e57c5b005fcaaaa2893d06ce"
---

# Auth

## Purpose
Authentication and authorization for Eventizer. Better Auth 1.4 handles sessions via OAuth
(Google, Facebook) and email/password; the session user is synced to the Payload `Users`
collection via a custom auth strategy. Role hierarchy: `admin → moderator → service-provider → client`.
Access control is implemented through factory functions (`roleOrHigher`, `roleOrHigherOrSelf`,
`providerOrHigher`) that compose into collection-level access rules. Email verification and
password-reset flows use Resend for transactional email.

## Anchors
- `src/auth/auth.ts` — Better Auth configuration and Payload user sync strategy.
- `src/auth/auth-client.ts` — client-side Better Auth instance.
- `src/collections/auth/` — Payload collections: Users, Accounts, Sessions, Verifications.
- `src/access/` — access factory utilities (`roleOrHigher`, `authenticated`, `authenticatedOrPublished`).
- `src/app/api/auth/` — Better Auth API handler routes.
- `src/app/(frontend)/[lang]/auth/` — sign-in, sign-up, forgot/reset password pages.

## Invariants
- `roleOrHigher` / `*OrSelf` factories are the single source of truth for role-based access;
  inline role comparisons in ad-hoc code are forbidden.
- Every protected server action and panel page must re-validate the session via `auth.api.getSession`;
  never trust a cached or prop-passed session for writes.
- No automated test guards the role hierarchy yet — tracked as tech-debt (`[[access-control-test-coverage]]`).
