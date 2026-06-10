---
type: zone
summary: "The authenticated provider/client dashboard: PanelShell + sidebar, per-page auth+role guards, PanelPageHeader, AnimatedCard grids, Polish route segments."
tags: [panel, auth, ui]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[polish-url-param-names]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: ["/panel"]
  anchors: ["symbol:PanelPageHeader", "symbol:AnimatedCard"]
  globs:
    - "src/app/(frontend)/[lang]/panel/**"
    - "src/components/panel/**"
depends: ["[[auth]]", "[[design-system]]"]
invariants:
  - rule: "Every panel page re-checks the session + loads the Payload user + applies its role redirect (never trusts a stale session)."
    enforcedBy: ["[[skill:eventizer-panel-conventions]]"]
verifiedAt: "65085a725ed5d2977d7d9fa4877622e35fea2924"
---

# Panel

## Purpose
The authenticated dashboard for service providers and clients at `/panel`. `PanelShell` wraps
every page in a shadcn `SidebarProvider` + `SidebarInset`. `PanelNav` renders role-indexed nav
lists (`serviceProviderNav` for admin/moderator/service-provider, `clientNav` for clients).
Every page independently re-checks the session, loads the full Payload user, and applies role
redirects — the layout-level check is insufficient because role rules vary per page. `PanelPageHeader`
provides the hero banner with title, description, breadcrumbs, and optional progress bar.
`AnimatedCard` / `AnimatedCardGrid` deliver spring-animated list grids. Route segments are Polish
(`/oferty`, `/ulubione`, `/plan-subskrypcji`, etc.); only `/dashboard` stays English (historical).

## Anchors
- `src/components/panel/PanelPageHeader.tsx` — `PanelPageHeader` header component.
- `src/components/panel/AnimatedCards.tsx` — `AnimatedCard` / `AnimatedCardGrid` list wrappers.
- `src/components/panel/PanelNav.tsx` — sidebar nav with role-indexed arrays.
- `src/app/(frontend)/[lang]/panel/` — route tree (dashboard, oferty, ulubione, konto, etc.).

## Invariants
- Session + Payload user double-check is required per page; do not trust a stale layout session alone.
- Polish route segments must not be translated on a whim — they are linked from emails and Stripe redirects.
- `AdminDisclaimer` must appear for admin/moderator viewing provider/client-scoped pages.
