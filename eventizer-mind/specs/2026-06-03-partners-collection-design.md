---
type: spec
summary: "Refactor the Partners block from a per-page inline `partners` array into a reusable `partners` collection (label 'Partnerzy Eventizer'). Add a new `partnersV2` block that hand-picks partners from the collection via a hasMany relationship (FeaturedOffers pattern), reusing the existing carousel client UI unchanged. Seed the collection with the 10 current homepage partners via a local-API migration that auto-links each offer by its stable `link` slug. v1 block and all Pages are left untouched; the V2 block is added to pages manually."
tags: [content-blocks, cms, blocks, collection, partners, offers-data]
status: draft
created: 2026-06-03
updated: 2026-06-03
related: ["[[content-blocks]]", "[[media]]", "[[offers-data]]", "[[design-system]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]", "[[2026-06-02-product-overview-design]]"]
origin: "User request: the Partners block is reused across several subpages and partners are re-entered manually each time (redundant). Solution: create a `partners` collection ('Partnerzy Eventizer') with the same fields, and a new PartnersV2 block that picks partners from that collection instead of an inline array. Seed the collection from the 10 partners currently on the homepage (Page 4). Don't modify pages — the V2 block is added manually. Brainstormed 2026-06-03."
---

# Partners collection + PartnersV2 block — Design

## Context & motivation

The `Partners` block ([`src/blocks/Partners/config.ts`](../../src/blocks/Partners/config.ts)) stores its partners as an **inline `array` field** (2–12 rows) directly on each Page. Each row carries: `name`, `tagline`, `quote`, `logo` (upload→media), `accentColor` (select), `offer` (relationship→offers), `externalUrl`.

The block is reused on several subpages. Because the partner list is inline block data, every page that wants to show partners must **re-enter the same partners by hand** — redundant and drift-prone (edit a partner's quote once, and it's stale everywhere else).

The homepage (Page 4) currently has **10 partners** populated in this array. Live data (fetched 2026-06-03 from `/api/pages/4`): all 10 have `name` / `tagline` / `quote` / `accentColor`; none have a `logo`; 9 of 10 have an `offer` relationship (Meetly is the only one without); 9 of 10 have an `externalUrl` (DJ SPDR is the only one without).

**Goal:** make partners a first-class, single-source-of-truth collection that pages reference, eliminating the per-page duplication — without changing the visual carousel and without disturbing existing pages.

## Decisions (from brainstorming)

1. **Selection model — relationship pick.** The new block hand-picks and orders partners per page via a `hasMany` relationship (the `FeaturedOffers` pattern), not "show all active". Curated subsets per page.
2. **No data loss, no page edits.** Seed the new collection with the 10 existing homepage partners. Do **not** modify any Page document. The V2 block is added to pages manually by the user later.
3. **v1 stays.** The existing `Partners` block (slug `partners`) remains registered so the homepage and every other page keep working. v2 is additive.
4. **Same fields.** The collection's per-partner fields are identical to today's inline array item. No `isActive` toggle (with explicit picking, unwanted partners are simply not picked — YAGNI).
5. **Auto-link offers on seed.** The seed wires each partner's `offer` relationship by looking up the offer via its stable `link` slug, preserving all 9 offer links automatically.

## Naming note

- The runtime collection slug is `partners` and the block slug is `partnersV2`. These are distinct namespaces (collections vs. blocks) so there is no clash with the existing block's slug `partners`. The admin **label** for the collection is "Partnerzy Eventizer".

## Design

Five units of work, all within the `content-blocks` zone (the new collection is admin-curated content powering a block; it depends on `media` and `offers-data`).

### 1. New collection — `src/collections/Partners.ts` (slug `partners`)

Modeled on [`EventTypes`](../../src/collections/EventTypes.ts).

```
slug: 'partners'
interfaceName / generated type: 'Partner'
labels: { singular: { en: 'Partner', pl: 'Partner' },
          plural:   { en: 'Partners', pl: 'Partnerzy Eventizer' } }
orderable: true
admin:
  useAsTitle: 'name'
  group: adminGroups.website        // "Strona"
  defaultColumns: ['name', 'tagline', 'offer']
  hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user)
  description: pl/en — "Partners shown by the Partners (V2) block. Edit once, reused across pages."
access:
  read: publicAccess
  create / update / delete: adminOrHigher
hooks:
  afterChange: [revalidatePartners]   // revalidatePath('/', 'layout') guarded by context.disableRevalidate
  afterDelete: [revalidatePartnersOnDelete]
```

**Fields (identical shape to today's inline array item):**

| field | type | notes |
| --- | --- | --- |
| `name` | text, required | useAsTitle |
| `tagline` | text | city/category descriptor |
| `quote` | textarea | spotlight blurb |
| `logo` | upload → `media` | optional; client falls back to a stylized initial |
| `accentColor` | select, default `primary` | same 6 options: primary / accent / blue / emerald / violet / rose |
| `offer` | relationship → `offers` | optional; resolves the "Zobacz ofertę" button |
| `externalUrl` | text | optional; resolves the "Odwiedź stronę" button |

The field-level admin descriptions/labels are carried over verbatim from the v1 array item so the editing experience is unchanged.

Register `Partners` in [`src/payload.config.ts`](../../src/payload.config.ts) `collections: [...]` and run `pnpm generate:types`.

### 2. Shared resolver + type — `src/blocks/Partners/shared.ts`

To avoid duplicating the offer-resolution logic and the carousel-prop type across v1 and v2, extract them into a shared module:

- **`ResolvedPartner`** — a **structural** type (no longer derived from the block's array type) holding exactly what the client carousel consumes:
  `{ name; tagline?; quote?; logo?: number | Media | null; accentColor?: string | null; offerHref: string | null; externalHref: string | null }`.
- **`resolvePartners(rawPartners): Promise<ResolvedPartner[]>`** — takes an array of partner-like objects (each with an `offer` relationship and an `externalUrl`), collects referenced offer IDs, re-fetches those offers fresh (`_status: published`, `depth: 0`, `select: { link: true }`) exactly as the current v1 `Component.tsx` does, and maps each partner to a `ResolvedPartner` (computing `offerHref = /ogloszenia/<link>` and trimmed `externalHref`). The `logo` and the scalar fields pass through unchanged.

This is the single place the "re-fetch offers fresh so static pages stay accurate" logic lives.

### 3. Refactor v1 server component to use the shared resolver

[`src/blocks/Partners/Component.tsx`](../../src/blocks/Partners/Component.tsx) is rewritten to call `resolvePartners(partners ?? [])` and pass the result + block-level props (`badge`, `heading`, `description`, `rotationSeconds`) into `PartnersClient`. Net behavior identical; the inline offer-fetch code is removed in favor of the shared helper. `Component.client.tsx` is **not touched**.

### 4. New block — `src/blocks/PartnersV2/`

- **`config.ts`** — block slug `partnersV2`, interfaceName `PartnersV2Block`, labels "Partnerzy V2" / "Partners V2". Block-level fields `badge`, `heading`, `description`, `rotationSeconds` are copied from v1 (same defaults). The inline `partners` array is **replaced** by:
  ```
  { name: 'partners', type: 'relationship', relationTo: 'partners',
    hasMany: true, required: true, minRows: 2,
    label: { en: 'Partners', pl: 'Partnerzy' },
    admin: { description: pl/en — "Pick partners from the Partnerzy Eventizer collection." } }
  ```
- **`Component.tsx`** (server) — mirrors [`FeaturedOffers/Component.tsx`](../../src/blocks/FeaturedOffers/Component.tsx):
  1. extract selected partner IDs (relationship may be expanded docs or IDs),
  2. return `null` if none,
  3. re-fetch those partner docs fresh from the `partners` collection (`depth: 1` so `logo` is populated), preserving the editor's chosen order,
  4. pass them through `resolvePartners()` (step 2),
  5. render the **existing** `PartnersClient` with the resolved partners + block props.
- No new client component — the carousel UI is `Component.client.tsx`, reused.

Register the block in [`src/collections/Pages/index.ts`](../../src/collections/Pages/index.ts) `blocks: [...]` (alongside `Partners`, not replacing it) and add `partnersV2 → PartnersV2Block` to the `blockComponents` map in [`src/blocks/RenderBlocks.tsx`](../../src/blocks/RenderBlocks.tsx). Run `pnpm generate:types`.

### 5. Seed migration — `src/migrations/<ts>_seed_partners.ts`

Follows the [`seed_event_types`](../../src/migrations/20260526_120500_seed_event_types.ts) precedent but uses **Payload's local API** (available as `payload` / `req` in `MigrateUpArgs`) rather than raw SQL, because the `offer` relationship must be resolved by slug and written through Payload's relationship handling.

- A hardcoded `PARTNERS` list of the 10 current homepage partners: `{ name, tagline, quote, accentColor, externalUrl | null, offerLink | null }` (the exact data captured from `/api/pages/4` on 2026-06-03 — see Appendix).
- `up()`: for each entry —
  1. **Idempotency:** `payload.find({ collection: 'partners', where: { name: { equals: p.name } }, limit: 1 })`; skip if it already exists.
  2. **Offer lookup:** if `p.offerLink`, `payload.find({ collection: 'offers', where: { link: { equals: p.offerLink } }, limit: 1, overrideAccess: true })`; use `docs[0]?.id` or `null` if not found (so the migration never fails on a missing offer in any environment).
  3. `payload.create({ collection: 'partners', data: { ...scalars, offer: offerId }, overrideAccess: true })`.
- `down()`: delete the seeded partners by the same `name` list (leaves any admin-created partners alone).
- `logo` is left null for all (none have one today; admin can upload via the panel later — same approach event-types took with icons).

Add the migration to [`src/migrations/index.ts`](../../src/migrations/index.ts).

## What is explicitly NOT done

- **No Page documents are edited.** The homepage keeps its v1 inline block. The user adds the V2 block where desired.
- **v1 block is not removed or deprecated in code.** (A future cleanup — once all pages move to V2 — can tombstone it; out of scope here.)
- No `isActive` flag, no "show all" mode, no per-page partner overrides.

## Data flow

```
Page (CMS) ──picks──> partnersV2 block { partners: [relationship ids] }
   └─ RenderBlocks ─> PartnersV2/Component.tsx (server)
        ├─ payload.find('partners', ids, depth:1)        // fresh partner docs + logo
        ├─ resolvePartners(docs)                          // re-fetch offers fresh -> offerHref/externalHref
        └─ <PartnersClient {...blockProps} partners={ResolvedPartner[]} />   // existing carousel UI
```

## Testing

- **Types:** `pnpm generate:types` then `pnpm lint` — confirm `Partner` and `PartnersV2Block` types generate and both server components type-check against the shared `ResolvedPartner`.
- **Migration:** run `pnpm payload migrate` against a dev DB; assert 10 `partners` rows created, 9 with a resolved `offer`, re-running is a no-op (idempotent), and `migrate:down` removes exactly those 10.
- **Render parity:** add the V2 block to a scratch page picking the seeded partners; verify the carousel is visually identical to the homepage v1 block (spotlight rotation, accent colors, "Zobacz ofertę" / "Odwiedź stronę" buttons resolve correctly).
- **Revalidation:** edit a seeded partner's quote in the panel; confirm pages using the V2 block reflect the change after revalidation.
- Existing integration/e2e suites (`pnpm test`) must stay green (v1 untouched).

## Mind maintenance (on finish)

- Update the [[content-blocks]] zone card: note the new `partners` collection under Anchors/globs (`src/collections/Partners.ts`, `src/blocks/PartnersV2/**`), and re-stamp `verifiedAt` to the new HEAD.
- Add a `map/decisions/` record for the "v1 + v2 coexist; partners promoted to a collection" choice.
- `pnpm mind:check` and commit the regenerated `index.md`.

## Appendix — seed data (captured 2026-06-03 from /api/pages/4)

| name | tagline | accentColor | externalUrl | offer.link |
| --- | --- | --- | --- | --- |
| SkyClub Białystok | Klub muzyczny · Białystok | primary | https://sky-club.pl/ | SkyBialystok |
| Meetly | E-zaproszenia online | blue | https://meetly.com.pl/ | — |
| Apartamenty Zielona Lipka | Mazury · jezioro Roś | emerald | https://zielonalipka.pl/ | apartamenty-zielona-lipka |
| Apartamenty pod Gromadzyniem | Bieszczady · Ustrzyki Dolne | violet | https://www.facebook.com/apartamentypodgromadzyniem/ | apartamentypodgromadzyniem |
| Princess Palace Gdańsk | Willa eventowa · Gdańsk | rose | https://princesspalace.pl/ | princess-palace-gdansk |
| DJ SPDR | Muzyka i rozrywka | accent | — | Spdrofficial |
| Misiak Events | Agencja eventowa · Kielce | blue | https://www.facebook.com/misiak.events/ | nowa-oferta-2603-111740 |
| Wesela na głowie | Agencja eventowa · Tłuszcz | emerald | https://www.instagram.com/wesele_na_glowie/ | Weselenaglowie |
| Santiago Events | Agencja eventowa · Płocochowo | rose | https://www.instagram.com/santiago_eventss?igsh=OTBuenI0d2ozbTRl | santiago-events |
| Na Łośmiu Metrach | Domek na drzewie · Białystok | accent | https://www.instagram.com/na_losmiu_metrach/ | nalosmiumetrach |

Full `quote` text for each partner is preserved in the live API response and will be transcribed verbatim into the seed list during implementation.
