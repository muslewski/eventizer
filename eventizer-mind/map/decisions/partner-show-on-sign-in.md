---
type: decision
summary: "Sign-in 'Zaufali nam najlepsi' logos are driven by a showOnSignIn checkbox on the partners collection (logo-only, max 4, drag-ordered), and the fake hero stats were replaced with honest beta numbers."
tags: [auth, sign-in, partners, payload]
status: active
created: 2026-06-05
updated: 2026-06-05
related: ["[[auth]]", "[[content-blocks]]", "[[partners-promoted-to-collection]]"]
sources: ["[[2026-06-05-sign-in-real-stats-partner-logos-design]]"]
decided: 2026-06-05
supersededBy: ""
---

# Sign-in trust row reuses the partners collection; honest hero stats

## Context
The two sign-in heroes (`MediumImpact`) showed fabricated stats (`200K+` users, `5K+`/`70K+`/`120+`)
and a "Zaufali nam najlepsi" row of four empty placeholder circles. We already store real partner
content in the `partners` collection (see [[partners-promoted-to-collection]]).

## Decision
- Hero stats are now honest beta numbers: service-provider `500+` Zarejestrowanych użytkowników /
  `50` Wydarzeń miesięcznie; client `100+` Aktywnych usług / `10` Branż eventowych — plain prop
  strings on the two `auth/.../layout.tsx` files.
- A new `showOnSignIn` checkbox on `partners` curates the trust row. An async `TrustedPartners`
  server component (`src/heros/MediumImpact/Content/TrustedPartners.tsx`) queries partners where
  `showOnSignIn = true AND logo exists`, `sort: '_order'`, `limit: 4`, and renders their logos;
  it returns `null` (heading included) when none qualify.

## Why
Reuse the single partner source of truth rather than a second list. Logo-only + empty-state-hides
keeps the screen honest: a flagged partner with no logo simply doesn't show, which is the signal
to upload its logo. Both sign-in screens share `MediumImpact` `Content`, so they show the same
curated set with no per-screen wiring.

## Consequences
Adding the checkbox added the `partners.show_on_sign_in` column via
`src/migrations/20260605_120000_add_partner_show_on_sign_in.ts` (registered in `ALWAYS_RUN`), per
[[migrate-before-next-build]]. Sourcing partner logos from their websites is deferred to admins —
at implementation time all 10 seeded partners had no logo, so the trust row renders hidden until
logos are uploaded and the checkbox is ticked.
