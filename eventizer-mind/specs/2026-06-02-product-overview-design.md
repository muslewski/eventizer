---
type: spec
summary: "Add a single rich Product Overview note to the Mind so future agents grasp WHAT Eventizer is and WHY — the abstract product/domain context, grounded in the live eventizer.pl ↔ code mapping — not just the technical zones."
tags: [the-mind, product, knowledge-base]
status: draft
created: 2026-06-02
updated: 2026-06-02
related: ["[[the-mind]]", "[[offer-listing]]", "[[content-blocks]]", "[[billing]]", "[[auth]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
origin: "User asked to make the knowledge base 'really full of context about eventizer' — the abstract understanding of what it's about, comparing the actual eventizer.pl website (its sections, messaging) with the code, so future agents 'get what we are trying to do.' Brainstormed 2026-06-02; user chose the lightest option: a single rich overview note (not a full structured product layer)."
---

# Product Overview note — Design

## Context & motivation

The Mind currently captures Eventizer **technically** — 11 code zones, 6 decisions, the ledger. But the **product/domain understanding** (what Eventizer is, who it serves, what each part of the experience communicates, how the live site maps to the code) lives nowhere a future agent would find it. The `eventizer-architecture` entry-ramp skill has a terse one-paragraph summary; that's the ceiling today.

A future agent reading the zones learns *where the wizard code is* but not *why offers matter, who lists them, what the free-beta is about, or what story the homepage tells*. That abstract "getting it" is what this note adds.

Scope decision (brainstorming): **a single rich narrative note**, not a structured layer of personas/flows/anatomy notes. YAGNI — one well-grounded overview, pointed to from the auto-loaded projections.

## Design

### The note

- **File:** `eventizer-mind/map/overview.md`
- **Type:** a new `type: product` — documented in the vault README as *"present-tense product/domain narrative — the abstract what & why; not code-anchored, not verified by the generator."*
- **Location rationale:** `map/` root (beside `index.md`), NOT `map/zones/`. The generator only reads `map/zones/` and `map/flows/`, so this note has zero tooling interaction — no anchor verification, no freshness stamp, no maintenance beyond editing prose. It is narrative Map knowledge (present-tense "what IS"), more stable than code.
- **Frontmatter:** universal fields + `type: product`. `related:` links the technical zones it bridges (`offer-listing`, `content-blocks`, `billing`, `auth`); `sources:` links the design-session spec. A body footer line records *"grounded against eventizer.pl on 2026-06-02"* so a human can spot drift if the product pivots.

### Content (single note, grounded in the live site + block configs, with real Polish quotes)

1. **Essence** — one paragraph: a Polish two-sided event-services marketplace connecting clients planning events with verified service providers. Tagline *"Łączymy ludzi z pasją do tworzenia niezapomnianych chwil"*; hero *"Twój event. Nasi profesjonaliści." / "Od muzyki po dekoracje — wszystko, czego potrzebujesz, w jednym miejscu."*
2. **The problem it kills** — quoted Mission copy: *"Branża eventowa w Polsce działa na starych zasadach — szukanie usługodawców to godziny scrollowania, dzwonienia i porównywania ofert na własną rękę. Chcemy to zmienić."* Eventizer = *"miejsce, gdzie jedno kliknięcie wystarczy, by znaleźć idealnego fotografa, DJ-a czy catering."*
3. **Who it serves** — woven, not separate persona files: **clients** (browse & contact pros, free), **service providers** (list offers across 10 categories, subscribe), **admin/moderator** (curate, verify, view others' context via AdminDisclaimer).
4. **The three values** — *prostota* (one place, smart search, find in minutes), *transparentność* (clear prices, real reviews, verified profiles, no hidden costs), *dostępność* (every provider, regardless of size, gets fair reach). How each manifests in the product.
5. **Business model** — clients free (Eventizer facilitates **discovery, not payments**; no transaction fees); providers pay a **Stripe subscription** tiered by category access + offer limits; **currently free beta** (*"Dodaj ofertę za darmo"*, no credit card, first-mover framing).
6. **The 10 service categories** — Muzyka i rozrywka, Foto i wideo, Atrakcje eventowe, Miejsce wydarzenia, Organizacja i planowanie, Dekoracje i florystyka, Catering i Napoje, Technika, Beauty, Wynajem aut.
7. **Homepage anatomy** — a compact table mapping the live section flow → block component → what it communicates, with zone links. The agreed "live site ↔ code sections" comparison, distilled:

   | Live section | Block | Communicates |
   | --- | --- | --- |
   | Hero | hero / `BackgroundVideo` | "Twój event. Nasi profesjonaliści." + CTA *Przeglądaj oferty* |
   | Offers map | `OffersMap` | breadth — N listings across Poland, filterable → `[[offer-listing]]` |
   | Featured offers | `FeaturedOffers` | social proof — 3 highlighted providers |
   | Service categories | `ServiceCategories` ("Nasze kategorie") | the 10-category taxonomy, entry into browse |
   | Beta pitch | `BetaBanner` | provider acquisition — free beta, "Bądź pierwszy" |
   | Partners | `Partners` | trust — testimonial carousel of real partners |
   | How it works | `HowItWorks` | client journey: Find → Contact → Create |

   (All blocks → `[[content-blocks]]`.)
8. **Voice & tone** — Polish-first; casual second-person (*"Twój event"*); warm/enthusiastic; beta-urgency (*"to najlepszy moment"*, *"bez zobowiązań"*); trust/verified framing. The frontend should feel like a high-end event invitation, not a generic SaaS dashboard.
9. **Bridges** — short pointers to the technical zones for "where this lives in code."

### Discovery (no generator/index change — the lightest path)

- **`CLAUDE.md`** dev rule, "Before working" step, gains a first beat: *read `eventizer-mind/map/overview.md` to understand what Eventizer is* → then the index → the zone. CLAUDE.md auto-loads every session, so this is the strongest channel.
- **`eventizer-architecture`** entry-ramp skill points to `overview.md` as the big-picture read (one line near the top of its "Orient via the Mind first" section).
- **Vault `README.md`** documents the new `product` type and adds overview to the resolution ladder.

## Non-goals (YAGNI)

- **No separate persona / journey-flow / site-anatomy notes** — all folded into the one overview note. (The flow type stays unused for now.)
- **No generator or `map/index.md` change** — discovery is via CLAUDE.md + entry-ramp + README, not a generated banner.
- **No automated verification** of the narrative against the live site — it's stable Map prose; the "grounded on <date>" footer makes drift human-visible, and an agent updates it like any Map note if the product pivots.
- **No new code** — this is content + three small pointer edits to existing projections.

## Done criteria

- [ ] `eventizer-mind/map/overview.md` exists, `type: product`, rich content per §Content, real Polish quotes, `related:` zone links resolve to real notes.
- [ ] `pnpm mind:check` still green (overview.md is outside `map/zones/`, so zone count stays 11, 0 errors).
- [ ] Vault README documents the `product` type.
- [ ] CLAUDE.md orients to overview.md first; the entry-ramp skill points to it.
- [ ] Committed on `feat/mind-product-overview`.
