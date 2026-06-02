---
type: decision
summary: "Panel list pages use Polish query keys (`strona`, `filtr`, `q`) and panel routes use Polish path segments; only `/dashboard` stays English."
tags: [panel, routing, i18n]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[panel]]", "[[offer-listing]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
decided: 2026-06-02
supersededBy: ""
---

# Polish query keys and route segments in the panel

## Context
List pages in the panel need query parameters for pagination, filtering, and search. Panel
feature areas need named route path segments. Eventizer is a Polish-first product — all UI
labels and user-facing text are in Polish. Without a naming convention, individual pages would
independently pick English keys (`page`, `filter`, `search`) or Polish keys, creating an
inconsistent URL surface. Route segments are also linked from transactional emails (Resend)
and from Stripe redirect URLs (subscription portal), so renaming them after launch breaks live
links that cannot easily be invalidated.

## Decision
List pages use Polish query keys: `strona` for the page number (not `page`), `filtr` for
filter state (not `filter`), and `q` for the search query. Panel route segments are Polish:
`/oferty`, `/ulubione`, `/plan-subskrypcji`, `/pomoc`, `/formularze`, `/konto`. The `/dashboard`
segment remains English because it predates this convention and is already embedded in emails
and Stripe redirects.

## Why
User-facing URL consistency matters in a Polish-first product — Polish segment names match the
language of every other element on the page. More critically, route segments are hard external
links: Stripe's customer portal redirect and Resend transactional emails reference them directly.
Renaming them silently breaks those integrations. Fixing a naming inconsistency is not worth the
operational risk of breaking live redirect chains.

## Consequences
Any new list page must use `strona`, `filtr`, and `q` as its query param keys. Any new panel
feature route must use a Polish segment name. Existing segments — especially `/dashboard` —
must not be renamed without a coordinated update of all email templates and Stripe webhook/
portal redirect configurations. When a new route is promoted from prototype to shipped (e.g.
linked from an email), the segment name is locked in at that point.
