# Product Overview Note Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single rich `type: product` overview note to the Mind so future agents grasp what Eventizer is and why, grounded in the live eventizer.pl ↔ code mapping, and make it the first thing the projections point to.

**Architecture:** One narrative note at `eventizer-mind/map/overview.md` (in `map/` root, so the generator — which only reads `map/zones/` and `map/flows/` — never touches it). Document the new `type: product` in the vault README. Wire discovery through the auto-loaded projections (root `CLAUDE.md` + the `eventizer-architecture` entry-ramp skill). No generator/index change, no new code.

**Tech Stack:** Markdown + YAML frontmatter (the Mind vault); `pnpm mind:check` (the generator) for the no-regression check; `js-yaml`-parsed frontmatter conventions.

**Spec:** `eventizer-mind/specs/2026-06-02-product-overview-design.md`.

**Branch:** `feat/mind-product-overview` (already created; do NOT switch). Commit per task.

---

### Task 1: Author the Product Overview note + document the `product` type

**Files:**
- Create: `eventizer-mind/map/overview.md`
- Modify: `eventizer-mind/README.md` (add `product` to the type list + the resolution ladder)

- [ ] **Step 1: Create `eventizer-mind/map/overview.md`** with EXACTLY this content:

```markdown
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
```

- [ ] **Step 2: Document the `product` type in `eventizer-mind/README.md`.** Read the file first. Under the "Per-type extras" list, immediately after the `- **debt** → ...` bullet (the last one), insert:

```markdown
- **product** → (no extra fields) — present-tense product/domain narrative: the abstract "what & why" (vision, values, model, voice). Lives in `map/` root; not anchor-verified by the generator.
```

Then in the "Resolution ladder" section, add this as the FIRST bullet (above the `map/index.md` line):

```markdown
- `map/overview.md` — the **product overview**: what Eventizer is, who it serves, why. Read this first.
```

- [ ] **Step 3: Verify the note's wikilinks resolve and the generator is unaffected.**

Run:
```bash
cd /Users/muslewski/Documents/Repozytoria/eventizer
# every [[link]] in overview.md must target a real zone/spec note
for l in the-mind offer-listing content-blocks billing auth offers-data offer-wizard design-system; do
  test -f "eventizer-mind/map/zones/$l.md" && echo "OK zone $l" || echo "MISSING zone $l"
done
test -f eventizer-mind/specs/2026-06-02-product-overview-design.md && echo "OK spec product-overview-design"
test -f eventizer-mind/specs/2026-06-02-eventizer-mind-design.md && echo "OK spec eventizer-mind-design"
pnpm mind:check 2>&1 | tail -1
```
Expected: all `OK ...` lines (no `MISSING`), and `🧠 mind:check — 11 zones · 1 gaps · 0 errors` (overview.md is outside `map/zones/`, so the zone count is unchanged and there are 0 errors; the 1 gap is the pre-existing auth role-hierarchy gap).

- [ ] **Step 4: Commit.**

```bash
git add eventizer-mind/map/overview.md eventizer-mind/README.md
git commit -m "feat(mind): product overview note (what Eventizer is & why) + document type:product"
```

---

### Task 2: Wire discovery through the projections

**Files:**
- Modify: `CLAUDE.md` (orientation now starts at the overview)
- Modify: `.claude/skills/eventizer-architecture/SKILL.md` (entry-ramp points to the overview)

- [ ] **Step 1: Update `CLAUDE.md`.** Find the "Before working" line, currently exactly:

```markdown
**Before working:** load `eventizer-mind/map/index.md` → open the relevant zone card in
`eventizer-mind/map/zones/` → trace its `sources:` (the spec/decision that produced it). Don't
work blind. The matching `eventizer-*` skill auto-loads with the procedural how-to.
```

Replace it with:

```markdown
**Before working:** read `eventizer-mind/map/overview.md` (what Eventizer is & why) → load
`eventizer-mind/map/index.md` → open the relevant zone card in `eventizer-mind/map/zones/` →
trace its `sources:` (the spec/decision that produced it). Don't work blind. The matching
`eventizer-*` skill auto-loads with the procedural how-to.
```

- [ ] **Step 2: Update the entry-ramp skill `.claude/skills/eventizer-architecture/SKILL.md`.** In the "## Orient via the Mind first" section, the numbered list currently reads:

```markdown
1. Read `eventizer-mind/map/index.md` (every zone + freshness).
2. Open the zone card you're touching in `eventizer-mind/map/zones/` — purpose, anchors,
   invariants, and `sources:` (the why).
3. Load the companion procedural skill for that zone (below).
```

Replace that list with (inserting the overview as the new first step; do NOT change the skill's frontmatter):

```markdown
1. Read `eventizer-mind/map/overview.md` — what Eventizer is, who it serves, the homepage story (the big picture).
2. Read `eventizer-mind/map/index.md` (every zone + freshness).
3. Open the zone card you're touching in `eventizer-mind/map/zones/` — purpose, anchors,
   invariants, and `sources:` (the why).
4. Load the companion procedural skill for that zone (below).
```

- [ ] **Step 3: Verify the skill frontmatter is intact and the references exist.**

Run:
```bash
cd /Users/muslewski/Documents/Repozytoria/eventizer
head -4 .claude/skills/eventizer-architecture/SKILL.md   # must still be ---, name:, description:, ---
grep -c "map/overview.md" CLAUDE.md .claude/skills/eventizer-architecture/SKILL.md
```
Expected: frontmatter unchanged (opens `---` / `name: eventizer-architecture` / `description:` / `---`); each file reports `1` (or more) matches for `map/overview.md`.

- [ ] **Step 4: Commit.**

```bash
git add CLAUDE.md .claude/skills/eventizer-architecture/SKILL.md
git commit -m "feat(mind): orient agents to the product overview first (CLAUDE.md + entry-ramp)"
```

---

## Self-Review

**Spec coverage:** spec §"The note" (file, type, location, frontmatter) → Task 1 Step 1. §Content (all 9 sections, Polish quotes, anatomy table) → Task 1 Step 1 (full content provided). §Discovery (CLAUDE.md, entry-ramp, README) → README in Task 1 Step 2; CLAUDE.md + entry-ramp in Task 2. §Non-goals (no separate persona/flow notes, no generator/index change, no verification, no new code) → respected: only one note + README + two projection edits; `pnpm mind:check` is a no-regression check, not a change. §Done-criteria → Task 1 Steps 3–4 (note exists, links resolve, mind:check green, README documents the type) + Task 2 (CLAUDE.md/entry-ramp point to it). No gaps.

**Placeholder scan:** the full note content is provided verbatim (no "TBD"); README and projection edits give exact insert text + exact match targets. The "N listings"/dynamic-count concern from the spec is honored — the note says "real listings across Poland", not a hardcoded number. No placeholders.

**Type consistency:** the new note's `type: product` matches what the README documents and what the spec named. All `[[wikilinks]]` in the note (`the-mind`, `offer-listing`, `content-blocks`, `billing`, `auth`, `offers-data`, `offer-wizard`, `design-system`, and the two spec slugs) correspond to files verified to exist in Task 1 Step 3. The block names in the anatomy table (`OffersMap`, `FeaturedOffers`, `ServiceCategories`, `Mission`, `BetaBanner`, `Partners`, `HowItWorks`) match the real `src/blocks/` directories. CLAUDE.md and entry-ramp edits reference the exact path `eventizer-mind/map/overview.md` created in Task 1.
