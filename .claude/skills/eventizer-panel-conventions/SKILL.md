---
name: eventizer-panel-conventions
description: Use when adding or modifying pages under src/app/(frontend)/[lang]/panel/** — auth guards, role redirects, PanelShell composition, PanelPageHeader with breadcrumbs, AnimatedCard grids, mobile sidebar, and Polish URL param naming.
---

# Panel Conventions

Anything under `/panel/*` is authenticated, shadcn-based, and follows a shared skeleton.

## Auth + role guards

Every page starts with an auth check + optional role redirect. Copy this head from any existing page (e.g. [/panel/oferty/page.tsx](../../../src/app/(frontend)/[lang]/panel/oferty/page.tsx)):

```ts
const { lang } = await params
const session = await auth.api.getSession({ headers: await headers() })
if (!session?.user) redirect(`/${lang}/auth/sign-in`)

const payload = await getPayload({ config })
const user = await payload.findByID({
  collection: 'users',
  id: Number(session.user.id),
  depth: 0,
})
if (!user) redirect(`/${lang}/auth/sign-in`)

// Role redirect for provider-only pages:
if (user.role === 'client') redirect(`/${lang}/panel/dashboard`)
```

The layout at [`panel/layout.tsx`](../../../src/app/(frontend)/[lang]/panel/layout.tsx) already does the top-level session check; each page still re-checks for `user` + role because those rules vary per page. The session + Payload user double-check avoids trusting a stale session.

## PanelShell + sidebar

The panel shell is a shadcn `SidebarProvider` + `SidebarInset`. The sidebar itself is [PanelNav](../../../src/components/panel/PanelNav.tsx), with **role-indexed nav lists**:

- `serviceProviderNav` — used for service-provider AND admin AND moderator
- `clientNav` — used only for clients

Any of admin/moderator/service-provider → provider nav. Adding a new panel entry means updating the right array(s) and the route file.

The mobile sidebar trigger lives in [PanelMobileHeader](../../../src/components/panel/PanelMobileHeader.tsx) — `md:hidden`, outline button with an `ArrowRightFromLine` icon.

## PanelPageHeader

Every panel page starts its JSX with `<PanelPageHeader …/>` ([PanelPageHeader.tsx](../../../src/components/panel/PanelPageHeader.tsx)) — a tall hero with title, description, breadcrumbs, background image, optional progress bar (wizard uses this). Fetch the background URL via `getHeaderBackgroundUrl()` from [src/actions/panel/getHeaderBackground.ts](../../../src/actions/panel/getHeaderBackground.ts). Breadcrumbs are a `{ label, href? }[]` — last entry has no href.

## List grids — use AnimatedCard

Lists of cards (offers, favorites, tickets) wrap each row in [`<AnimatedCard>`](../../../src/components/panel/AnimatedCards.tsx) inside an [`<AnimatedCardGrid>`](../../../src/components/panel/AnimatedCards.tsx). This gives spring fade-in on view + hover lift + accent border — don't roll your own. Stagger via `delay={i * 0.08}`. The hover selector targets shadcn Card via `[data-slot=card]`, so use shadcn `<Card>` inside.

## URL params are in Polish

List pages use Polish query keys:

- `strona` = page number (not `page`)
- `filtr` = filter (not `filter`)
- `q` = search query

Match this convention when adding new params.

## Admin disclaimer

Admins/moderators viewing provider/client-scoped pages see [`<AdminDisclaimer>`](../../../src/components/panel/AdminDisclaimer.tsx) — a yellow banner clarifying they're viewing someone else's context. Variants: `dashboard` | `subscription` | `offers`.

## Metadata

Panel pages set a short `metadata.title` ("Panel główny", "Twoje oferty", etc.) — no `%s` suffix, no site-name tail. These render in the browser tab.

## Naming

Panel routes use Polish segments (`/oferty`, `/ulubione`, `/plan-subskrypcji`, `/pomoc`, `/formularze`, `/konto`). Only `/dashboard` stays English (historical). Don't translate the segment paths on a whim — they're linked from emails + Stripe redirects.
