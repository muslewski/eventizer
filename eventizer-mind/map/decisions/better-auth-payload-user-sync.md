---
type: decision
summary: "Better Auth manages sessions and OAuth; Payload Users collection syncs via a custom auth strategy so one identity serves both systems."
tags: [auth, payload]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[auth]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
decided: 2026-06-02
supersededBy: ""
---

# Better Auth and Payload share a single user identity via custom sync

## Context
Eventizer needs two things from its auth layer: session management + OAuth (Google, Facebook) +
email/password sign-in for end users, and an access-control model + admin UI for the Payload
CMS. Better Auth 1.4 handles the former well; Payload's built-in auth would require a different
session mechanism and breaks the OAuth flow. Running two fully independent user stores would
mean duplicate identities, diverging roles, and no single source of truth.

## Decision
Better Auth is the session authority and handles all sign-in flows (Google OAuth, Facebook OAuth,
email/password). Payload maintains a Users collection for its admin panel and collection-level
access control. Better Auth sessions are synced to the Payload Users collection through a custom
auth strategy, so the two systems share one identity — the same user record, the same role.

## Why
A single user identity is essential for a coherent role hierarchy
(`admin → moderator → service-provider → client`) and for Payload's access-control factory
functions (`roleOrHigher`, `roleOrHigherOrSelf`, `providerOrHigher`) to work correctly. Payload
also needs to know the user to enforce per-collection rules (e.g. `offersAccess.delete =
adminOrHigherOrSelf`). Keeping Better Auth as the session layer preserves the OAuth and
email/password flows without forking Payload's user model.

## Consequences
Protected server actions that need a fresh `role` must load the full Payload user by ID — the
session user may carry a stale role (e.g. after a Stripe webhook upgrades the user from client
to service-provider). The canonical pattern is:

```ts
const sessionUser = await getAuthenticatedUser()
const user = await payload.findByID({ collection: 'users', id: Number(sessionUser.id), depth: 0 })
```

Never trust `session.user.role` alone for gated operations. The session is used only for
identity verification (`session.user.id`); the authoritative role always comes from the Payload
Users record.
