---
type: product
summary: "What Eventizer is and why: a Polish two-sided event-services marketplace connecting clients planning events with verified providers (DJs, photographers, venues, caterers…). The abstract product/domain context — vision, values, business model, homepage story, voice — grounded in the live site."
tags: [product, vision, eventizer]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[the-mind]]", "[[offer-listing]]", "[[content-blocks]]", "[[billing]]", "[[auth]]", "[[offers-data]]", "[[offer-wizard]]", "[[design-system]]"]
sources: ["[[2026-06-02-product-overview-design]]", "[[2026-06-02-eventizer-mind-design]]"]
---

# Eventizer — Product Overview

> Read this first to understand WHAT Eventizer is and WHY. The zone cards tell you where the code is; this tells you what we're trying to do. Grounded against eventizer.pl on 2026-06-02.

## Essence

Eventizer (https://eventizer.pl) is a **Polish event-services marketplace** — a two-sided platform connecting people **planning events** with the **professionals** who make them happen: DJs, photographers, decorators, caterers, venues, planners, and more. Instead of scrolling, calling, and comparing providers one by one, a client finds, compares, and contacts the right pro in one place.

- **Tagline:** *"Łączymy ludzi z pasją do tworzenia niezapomnianych chwil"* (We connect people with a passion for creating unforgettable moments).
- **Hero:** *"Twój event. Nasi profesjonaliści."* — *"Od muzyki po dekoracje — wszystko, czego potrzebujesz, w jednym miejscu."*
- **In one line:** *"Platforma, która pomaga Ci stworzyć event bez stresu."*

## The problem it kills

> *"Branża eventowa w Polsce działa na starych zasadach — szukanie usługodawców to godziny scrollowania, dzwonienia i porównywania ofert na własną rękę. Chcemy to zmienić."*

The event industry runs on friction: fragmented discovery, opaque pricing, no single trusted catalog. Eventizer's bet: *"budujemy miejsce, gdzie jedno kliknięcie wystarczy, by znaleźć idealnego fotografa, DJ-a czy catering."* The mission, stated plainly: *"Wierzymy, że każda chwila zasługuje na wyjątkową oprawę"* and *"najlepsze wydarzenia zaczynają się od łatwego dostępu do sprawdzonych profesjonalistów."*

## Who it serves

- **Clients** (event organizers) — browse the catalog, filter by category/location, compare, and **contact providers for free**. Browsing needs no account; favoriting/contacting uses a client account. Clients never pay Eventizer.
- **Service providers** — create a profile and list offers across the 10 categories, reaching clients they couldn't before. Providers are the paying side (subscription — see Business model).
- **Admin / moderator** — curate the category taxonomy, verify/moderate offers and providers, and can view provider/client-scoped pages (flagged by an admin disclaimer so it's clear they're viewing someone else's context).

## The three values

These drive product decisions (About page + the `Mission` block):

1. **Prostota (Simplicity)** — one place, a clear catalog, smart search. Find the right offer in minutes, not hours.
2. **Transparentność (Transparency)** — clear prices, real reviews, verified profiles. No hidden costs.
3. **Dostępność (Accessibility)** — every provider, regardless of size, gets a fair chance to reach clients. Level the playing field. (During beta, also literally free.)

## Business model

- **Clients: free.** Eventizer facilitates **discovery, not transactions** — no booking/transaction fees. Contact happens off-platform between client and provider.
- **Providers: subscription.** Listing is gated by a **Stripe subscription**, with plans **tiered by category access and offer limits** — higher tiers unlock more (or restricted) categories and more concurrent offers. Subscription state drives the provider's role: a client becomes a service-provider on subscribing, and reverts on cancellation. → [[billing]]
- **Currently a free beta.** Providers list at no cost right now — *"Faza Beta — Dodaj swoje ogłoszenie za darmo!"*, no credit card, first-mover framing (*"Bądź pierwszy"*). The beta pitch is a deliberate provider-acquisition lever.

## Service categories

Ten top-level categories, each with subcategories (up to 3 levels deep), powering the taxonomy clients browse and providers list under:

Muzyka i rozrywka · Foto i wideo · Atrakcje eventowe · Miejsce wydarzenia · Organizacja i planowanie · Dekoracje i florystyka · Catering i Napoje · Technika · Beauty · Wynajem aut.

The taxonomy lives in the `service-categories` collection; offers resolve to a category slug-path. → [[offers-data]]

## Homepage anatomy — the story the landing page tells

The homepage is a CMS-composed Page (`/[lang]`, rendered by the `[slug]` template via `RenderBlocks`). Top-to-bottom, each section is a block carrying a piece of the pitch:

| Live section | Block | What it communicates |
| --- | --- | --- |
| Hero | hero (`BackgroundVideo` / image) | *"Twój event. Nasi profesjonaliści."* + CTA *Przeglądaj oferty* — the promise |
| Offers map | `OffersMap` | breadth & reality — real listings across Poland, filterable by category → [[offer-listing]] |
| Featured offers | `FeaturedOffers` | social proof — a few highlighted providers, *Poznaj ofertę* |
| Service categories | `ServiceCategories` (*"Nasze kategorie"* / *"Znajdź idealne usługi dla Twojego wydarzenia"*) | the taxonomy as the entry point into browsing |
| Mission | `Mission` (*"Co nas napędza"*) | the why — the problem and the change Eventizer is making |
| Beta pitch | `BetaBanner` | provider acquisition — free beta, *Dodaj ofertę za darmo* |
| Partners | `Partners` | trust — testimonial carousel of real partner businesses |
| How it works | `HowItWorks` | the client journey in 3 steps: **find → contact → create the event** |

All of these blocks live in the [[content-blocks]] zone; the public browse experience they funnel into is [[offer-listing]]. (Block order is CMS data, so it can vary per page; the above is the live homepage on the grounding date.)

## Voice & tone

- **Polish-first.** All user-facing copy is Polish; an `en` locale exists but is deferred.
- **Warm, second-person, confident** — *"Twój event"*, *"wszystko, czego potrzebujesz"*. Not corporate.
- **Beta urgency + reassurance** — *"to najlepszy moment"*, *"bez zobowiązań"*, *"bez karty kredytowej"*.
- **Premium, event-night feel** — dark theme, copper/gold accent, Bebas headlines. The frontend should feel like a **high-end event invitation, not a generic SaaS dashboard**. → [[design-system]]

## Where this lives in code

- Public browse / search / map / offer detail → [[offer-listing]]
- Homepage & marketing blocks → [[content-blocks]]
- Provider subscriptions & role transitions → [[billing]]
- Accounts & the client / provider / admin role model → [[auth]]
- Creating/editing the offers providers list → [[offer-wizard]]; the offer data model → [[offers-data]]

---

_Grounded against eventizer.pl (home + /o-nas) and the block configs on 2026-06-02. If the product pivots, update this note like any Map note and re-date this line._
