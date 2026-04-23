---
name: eventizer-server-actions
description: Use when creating or modifying a server action in src/actions/** — authentication, error shape, Payload overrideAccess/draft handling, revalidatePath, and the toast + router.push + router.refresh UX pattern on the client side.
---

# Server Actions in Eventizer

Server actions live under [src/actions/](../../../src/actions/), organized by surface (`panel/`, `stripe/`, top-level). Every file starts with `'use server'`.

## Authentication pattern

Every protected action begins with this two-line check ([src/actions/panel/offers.ts:10-14](../../../src/actions/panel/offers.ts)):

```ts
async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}
```

The session user carries `id` but may lack fresh `role`. When a role check matters (delete, moderation, role-gated operations), load the full Payload user:

```ts
const sessionUser = await getAuthenticatedUser()
const user = await payload.findByID({ collection: 'users', id: Number(sessionUser.id), depth: 0 })
```

## Return shape

Every action returns a discriminated union:

```ts
return { success: true as const, data: result }
return { success: false as const, error: 'Nie udało się …' }   // Polish error, user-facing
```

Toast the `error` on the client; never surface raw Payload errors. Exceptions in the action are caught by a top-level `try/catch` and converted to `success: false`.

## Payload access: when to `overrideAccess`

- **`overrideAccess: true`** when the action already enforces access (e.g. fetching the user's *own* drafts with `user: { equals: userId }`) — Payload's collection rules would otherwise hide drafts or restrict by role.
- **`overrideAccess: false` (default)** when the Payload collection's access rules are the right place to enforce (e.g. `deleteOffer` relies on [offersAccess.delete = adminOrHigherOrSelf](../../../src/collections/Offers/access.ts)).

When you do override, validate ownership/role yourself before the Payload call.

## Drafts and `_status`

Payload drafts: the `draft` param to `create`/`update` **must match** the `_status` field being saved. This trips people up — `createOffer` used to always pass `draft: true`, so clicking "Opublikuj" silently produced drafts.

The canonical pattern:

```ts
const isDraft = (data as any)._status === 'draft' || !(data as any)._status
await payload.update({ collection: 'offers', id, data, draft: isDraft, ... })
```

Mirror the same derivation in `create`. See **eventizer-offers-wizard** for how `_status` flows from the wizard.

## Cache invalidation

Mutations that change something rendered on a server-component page should call [`revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) from `next/cache` — e.g. `deleteOffer` revalidates `/panel/oferty`. Pair with a client-side `router.refresh()` after `router.push()` so both the cache and the current route re-run.

## Client call-site pattern

The full mutation flow on the client:

```tsx
const [isPending, startTransition] = useTransition()
const router = useRouter()

startTransition(async () => {
  const res = await someAction(args)
  if (res.success) {
    toast.success('…')
    router.push('/panel/…')
    router.refresh()
  } else {
    toast.error(res.error)
  }
})
```

Use `useTransition` (not manual `isLoading` state) so React can render the disabled state during the transition.
