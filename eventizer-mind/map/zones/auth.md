---
type: zone
summary: "Better Auth (OAuth + email/password) sessions synced to a Payload Users collection; role hierarchy and access-control factories."
tags: [auth, roles, access]
status: active
created: 2026-06-02
updated: 2026-06-10
related: ["[[better-auth-payload-user-sync]]", "[[access-control-test-coverage]]", "[[partner-show-on-sign-in]]"]
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
verifiedAt: "65085a725ed5d2977d7d9fa4877622e35fea2924"
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
- `src/app/(frontend)/[lang]/auth/` — sign-in, sign-up, forgot/reset password pages. The two
  sign-in layouts feed the `MediumImpact` hero honest beta stats and a `showOnSignIn`-driven
  partner-logo trust row (see [[partner-show-on-sign-in]]).

## Invariants
- `roleOrHigher` / `*OrSelf` factories are the single source of truth for role-based access;
  inline role comparisons in ad-hoc code are forbidden.
- Every protected server action and panel page must re-validate the session via `auth.api.getSession`;
  never trust a cached or prop-passed session for writes.
- No automated test guards the role hierarchy factories yet — tracked as tech-debt
  (`[[access-control-test-coverage]]`). Partial progress 2026-06-10: offers read access, upload
  create access, and offer-action ownership now have regression tests (`tests/int/access/`,
  `tests/int/actions/`); the factories themselves remain uncovered.
- The Resend client in `src/auth/email/sendEmail.ts` is lazily constructed — importing the
  auth/config chain must never throw when RESEND_API_KEY is absent (tests, CI).
