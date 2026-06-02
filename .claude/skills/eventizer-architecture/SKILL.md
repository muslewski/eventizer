---
name: eventizer-architecture
description: Use when working on the Eventizer project — provides project vision, design philosophy, architecture, and key technical decisions. Load this for context before making design, UX, or architectural choices in the Eventizer codebase.
---

# Eventizer — Entry Ramp

Eventizer is a Polish event-services marketplace (https://eventizer.pl) connecting service
providers (DJs, photographers, venues, caterers, …) with clients planning events. Dark theme,
copper/gold accent, Bebas/Montserrat type, Polish-first UI. Stack: Next.js 16 (App Router,
Turbopack) · Payload 3.75 · Better Auth · Vercel Postgres + Drizzle · Stripe · Vercel Blob ·
Resend · shadcn/ui + Tailwind 4 · Motion. Package manager: **pnpm**.

## Orient via the Mind first

The canonical, verified map lives in the vault. **Before changing code:**

1. Read `eventizer-mind/map/overview.md` — what Eventizer is, who it serves, the homepage story (the big picture).
2. Read `eventizer-mind/map/index.md` (every zone + freshness).
3. Open the zone card you're touching in `eventizer-mind/map/zones/` — purpose, anchors,
   invariants, and `sources:` (the why).
4. Load the companion procedural skill for that zone (below).

## Zone → companion skill

| Working on… | Zone card | Procedural skill |
| --- | --- | --- |
| Offer data model / hooks / migrations | `offers-data` | eventizer-payload-migrations |
| Create/edit offer wizard | `offer-wizard` | eventizer-offers-wizard |
| Public listings (ogloszenia, map, search) | `offer-listing` | eventizer-panel-conventions (params) |
| Panel pages | `panel` | eventizer-panel-conventions |
| Auth / roles / access | `auth` | eventizer-server-actions |
| Stripe / subscriptions | `billing` | eventizer-server-actions |
| CMS blocks / pages | `content-blocks` | eventizer-design-tokens |
| UI primitives / styling | `design-system` | eventizer-design-tokens |
| Uploads / video / image position | `media` | — |
| AI content generation | `ai-content` | eventizer-server-actions |
| Any server action | (cross-cutting) | eventizer-server-actions |

On finish, follow the Mind-first maintenance rule in the root `CLAUDE.md`.
