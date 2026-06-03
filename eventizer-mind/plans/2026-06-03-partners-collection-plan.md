# Partners Collection + PartnersV2 Block — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the inline Partners block array into a reusable `partners` collection ("Partnerzy Eventizer"), add a `partnersV2` block that hand-picks partners from it via a hasMany relationship, reuse the existing carousel UI unchanged, and seed the 10 current homepage partners (auto-linking their offers by slug). v1 block and all Pages stay untouched.

**Architecture:** New Payload collection `partners` (modeled on `EventTypes`). New block `partnersV2` (modeled on `FeaturedOffers`) whose server component fetches selected partner docs fresh and pipes them through a shared `resolvePartners()` helper into the existing `PartnersClient`. v1's server component is refactored to use the same helper (DRY). Two hand-written idempotent migrations (schema DDL + local-API seed), both registered in `ALWAYS_RUN`.

**Tech Stack:** Payload CMS 3.75 (Vercel Postgres adapter), Next.js App Router (RSC), TypeScript, Vitest (int), pnpm.

**Spec:** [`eventizer-mind/specs/2026-06-03-partners-collection-design.md`](../specs/2026-06-03-partners-collection-design.md)

**Branch:** `feat/partners-collection` (already created; spec already committed there).

---

## Reference patterns (read before starting)

- Collection template: [`src/collections/EventTypes.ts`](../../src/collections/EventTypes.ts)
- Collection registration: [`src/payload.config.ts`](../../src/payload.config.ts) `collections: [...]` (~line 122)
- Collection-backed block: [`src/blocks/FeaturedOffers/Component.tsx`](../../src/blocks/FeaturedOffers/Component.tsx) + [`config.ts`](../../src/blocks/FeaturedOffers/config.ts)
- Current Partners block: [`src/blocks/Partners/config.ts`](../../src/blocks/Partners/config.ts), [`Component.tsx`](../../src/blocks/Partners/Component.tsx), [`Component.client.tsx`](../../src/blocks/Partners/Component.client.tsx)
- Block registration: [`src/collections/Pages/index.ts`](../../src/collections/Pages/index.ts) (~line 93 `blocks:`) + [`src/blocks/RenderBlocks.tsx`](../../src/blocks/RenderBlocks.tsx)
- Schema migration (new collection): [`src/migrations/20260526_120000_add_event_types.ts`](../../src/migrations/20260526_120000_add_event_types.ts)
- Schema migration (block + single rels columns): [`src/migrations/20260523_180000_add_partners_block.ts`](../../src/migrations/20260523_180000_add_partners_block.ts) + [`20260523_190000_add_partners_upload_relationship_columns.ts`](../../src/migrations/20260523_190000_add_partners_upload_relationship_columns.ts)
- Seed migration: [`src/migrations/20260526_120500_seed_event_types.ts`](../../src/migrations/20260526_120500_seed_event_types.ts)
- Migration runner gotcha: [`scripts/prepare-migrations.mjs`](../../scripts/prepare-migrations.mjs) `ALWAYS_RUN` set (~line 56). **New migrations not added here are silently marked pre-applied and never run on Vercel.**

---

## File structure

| File | Responsibility | Action |
| --- | --- | --- |
| `src/collections/Partners.ts` | The `partners` collection config + revalidate hooks | Create |
| `src/payload.config.ts` | Register `Partners` in `collections` | Modify |
| `src/blocks/Partners/shared.ts` | `ResolvedPartner` type, pure `toResolvedPartner()`, async `resolvePartners()` | Create |
| `src/blocks/Partners/Component.tsx` | v1 server component → delegate to `resolvePartners()` | Modify |
| `src/blocks/Partners/Component.client.tsx` | Carousel UI — only the `ResolvedPartner` import path changes | Modify (1 line) |
| `src/blocks/PartnersV2/config.ts` | `partnersV2` block definition (relationship instead of array) | Create |
| `src/blocks/PartnersV2/Component.tsx` | v2 server component → fetch partners, `resolvePartners()`, render `PartnersClient` | Create |
| `src/collections/Pages/index.ts` | Register `PartnersV2` in the page `blocks` list | Modify |
| `src/blocks/RenderBlocks.tsx` | Map `partnersV2 → PartnersV2Block` | Modify |
| `tests/int/blocks/resolvePartners.int.spec.ts` | Unit test for `toResolvedPartner()` | Create |
| `src/migrations/20260603_120000_add_partners_collection_and_v2_block.ts` | DDL for the collection + the v2 block | Create |
| `src/migrations/20260603_120500_seed_partners.ts` | Local-API seed of the 10 partners | Create |
| `src/migrations/index.ts` | Register both migrations | Modify |
| `scripts/prepare-migrations.mjs` | Add both migrations to `ALWAYS_RUN` | Modify |
| `eventizer-mind/map/zones/content-blocks.md` | Note the new collection + block; re-stamp `verifiedAt` | Modify |
| `eventizer-mind/map/decisions/partners-promoted-to-collection.md` | Record the v1+v2-coexist decision | Create |

---

## Task 1: Create the `partners` collection

**Files:**
- Create: `src/collections/Partners.ts`
- Modify: `src/payload.config.ts` (collections array)

- [ ] **Step 1: Write the collection config**

Create `src/collections/Partners.ts`:

```ts
import { adminOrHigher, publicAccess } from '@/access'
import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { revalidatePath } from 'next/cache'
import {
  CollectionConfig,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import type { Partner } from '@/payload-types'

const revalidatePartners: CollectionAfterChangeHook<Partner> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc
  payload.logger.info(`Revalidating all pages — partner ${doc.id} ("${doc.name}") changed`)
  revalidatePath('/', 'layout')
  return doc
}

const revalidatePartnersOnDelete: CollectionAfterDeleteHook<Partner> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc
  payload.logger.info(`Revalidating all pages — partner ${doc.id} was deleted`)
  revalidatePath('/', 'layout')
  return doc
}

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: {
    singular: { en: 'Partner', pl: 'Partner' },
    plural: { en: 'Partners', pl: 'Partnerzy Eventizer' },
  },
  orderable: true,
  admin: {
    useAsTitle: 'name',
    group: adminGroups.website,
    defaultColumns: ['name', 'tagline', 'offer'],
    hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user),
    description: {
      en: 'Partners shown by the Partners (V2) block. Edit once here — reused across every page that picks them.',
      pl: 'Partnerzy wyświetlani przez blok Partnerzy (V2). Edytuj raz tutaj — wykorzystywani na każdej stronie, która ich wybierze.',
    },
  },
  access: {
    read: publicAccess,
    create: adminOrHigher,
    update: adminOrHigher,
    delete: adminOrHigher,
  },
  hooks: {
    afterChange: [revalidatePartners],
    afterDelete: [revalidatePartnersOnDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { en: 'Partner Name', pl: 'Nazwa partnera' },
    },
    {
      name: 'tagline',
      type: 'text',
      label: { en: 'Tagline', pl: 'Podtytuł' },
      admin: {
        description: {
          en: 'Short city/category descriptor shown next to the name, e.g. "Białystok" or "DJ na wesela".',
          pl: 'Krótki opis (miasto/kategoria) wyświetlany obok nazwy, np. "Białystok" lub "DJ na wesela".',
        },
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      label: { en: 'Spotlight quote / description', pl: 'Cytat / opis w wyróżnieniu' },
      admin: {
        description: {
          en: 'Optional short blurb shown when this partner is in the spotlight.',
          pl: 'Opcjonalny krótki opis wyświetlany gdy partner jest w centrum uwagi.',
        },
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Logo', pl: 'Logo' },
      admin: {
        description: {
          en: 'Optional. Falls back to a stylized initial if not provided.',
          pl: 'Opcjonalne. Wyświetlany jest inicjał, jeśli nie ustawione.',
        },
      },
    },
    {
      name: 'accentColor',
      type: 'select',
      defaultValue: 'primary',
      label: { en: 'Accent Color', pl: 'Kolor akcentu' },
      options: [
        { label: 'Primary (gold)', value: 'primary' },
        { label: 'Accent', value: 'accent' },
        { label: 'Blue', value: 'blue' },
        { label: 'Emerald', value: 'emerald' },
        { label: 'Violet', value: 'violet' },
        { label: 'Rose', value: 'rose' },
      ],
    },
    {
      name: 'offer',
      type: 'relationship',
      relationTo: 'offers',
      label: { en: 'Eventizer Offer', pl: 'Oferta na Eventizerze' },
      admin: {
        description: {
          en: 'Optional. Pick the partner’s offer to add a "Zobacz ofertę" button.',
          pl: 'Opcjonalne. Wybierz ofertę partnera, aby pokazać przycisk "Zobacz ofertę".',
        },
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      label: { en: 'Website URL', pl: 'Strona internetowa' },
      admin: {
        description: {
          en: 'Optional. Adds an "Odwiedź stronę" button linking to the partner\'s own site.',
          pl: 'Opcjonalne. Dodaje przycisk "Odwiedź stronę" prowadzący do strony partnera.',
        },
        placeholder: 'https://...',
      },
    },
  ],
}
```

- [ ] **Step 2: Register the collection**

In `src/payload.config.ts`, add the import near the other collection imports (e.g. next to `import { EventTypes } from '@/collections/EventTypes'`):

```ts
import { Partners } from '@/collections/Partners'
```

Then add `Partners` to the `collections: [...]` array under the `// Website` group (right after `Pages`):

```ts
  collections: [
    // Website
    Pages,
    Partners,

    // Marketplace
    Offers,
    // ...rest unchanged
```

- [ ] **Step 3: Generate types**

Run: `pnpm generate:types`
Expected: succeeds; `src/payload-types.ts` now contains a `Partner` interface and a `partners` entry in `Config['collections']`. (The `import type { Partner }` in the collection file is type-only/erased, so generation runs even though the type didn't exist before this command.)

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: no errors in `src/collections/Partners.ts` or `src/payload.config.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Partners.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat(partners): add Partners collection (Partnerzy Eventizer)"
```

---

## Task 2: Shared resolver + type, refactor v1 (TDD)

**Files:**
- Create: `src/blocks/Partners/shared.ts`
- Test: `tests/int/blocks/resolvePartners.int.spec.ts`
- Modify: `src/blocks/Partners/Component.tsx`
- Modify: `src/blocks/Partners/Component.client.tsx` (import path only)

- [ ] **Step 1: Write the failing test**

Create `tests/int/blocks/resolvePartners.int.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { toResolvedPartner } from '@/blocks/Partners/shared'

describe('toResolvedPartner', () => {
  it('builds offerHref from a published offer link (offer given as id)', () => {
    const map = new Map<number, string>([[117, 'SkyBialystok']])
    const r = toResolvedPartner(
      { name: 'SkyClub', offer: 117, externalUrl: 'https://sky-club.pl/' },
      map,
    )
    expect(r.offerHref).toBe('/ogloszenia/SkyBialystok')
    expect(r.externalHref).toBe('https://sky-club.pl/')
    expect(r.name).toBe('SkyClub')
  })

  it('leaves offerHref null when the offer id is absent from the published map', () => {
    const r = toResolvedPartner({ name: 'X', offer: 999 }, new Map())
    expect(r.offerHref).toBeNull()
  })

  it('handles an expanded offer object', () => {
    const map = new Map<number, string>([[203, 'apartamenty-zielona-lipka']])
    const r = toResolvedPartner(
      { name: 'Y', offer: { id: 203, link: 'apartamenty-zielona-lipka' } as never },
      map,
    )
    expect(r.offerHref).toBe('/ogloszenia/apartamenty-zielona-lipka')
  })

  it('trims externalUrl and nulls it when blank', () => {
    expect(toResolvedPartner({ name: 'Z', externalUrl: '   ' }, new Map()).externalHref).toBeNull()
    expect(
      toResolvedPartner({ name: 'Z', externalUrl: '  https://a.pl  ' }, new Map()).externalHref,
    ).toBe('https://a.pl')
  })

  it('passes the logo reference through unchanged', () => {
    expect(toResolvedPartner({ name: 'L', logo: 5 }, new Map()).logo).toBe(5)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/int/blocks/resolvePartners.int.spec.ts`
Expected: FAIL — cannot resolve module `@/blocks/Partners/shared` / `toResolvedPartner is not a function`.

- [ ] **Step 3: Implement the shared module**

Create `src/blocks/Partners/shared.ts`:

```ts
import type { Media, Offer } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

/** Carousel-ready partner shape consumed by PartnersClient. */
export type ResolvedPartner = {
  name: string
  tagline?: string | null
  quote?: string | null
  logo?: (number | Media) | null
  accentColor?: string | null
  /** Resolved /ogloszenia/<slug> URL when the partner's offer is set + published. */
  offerHref: string | null
  /** Trimmed external website URL, or null when not set. */
  externalHref: string | null
}

/** Raw partner shape shared by the inline block array and the partners collection. */
export type RawPartner = {
  name: string
  tagline?: string | null
  quote?: string | null
  logo?: (number | Media) | null
  accentColor?: string | null
  offer?: (number | Offer) | null
  externalUrl?: string | null
}

/**
 * Pure mapper: given a partner and a map of published-offer link slugs by id,
 * produce the carousel-ready ResolvedPartner. No I/O — unit-testable.
 */
export function toResolvedPartner(
  p: RawPartner,
  offerLinkById: Map<number, string>,
): ResolvedPartner {
  let offerHref: string | null = null
  if (p.offer != null) {
    const offerId = typeof p.offer === 'object' ? p.offer.id : p.offer
    const link = offerLinkById.get(offerId)
    if (link) offerHref = `/ogloszenia/${link}`
  }
  const externalHref = p.externalUrl?.trim() ? p.externalUrl.trim() : null
  return {
    name: p.name,
    tagline: p.tagline ?? null,
    quote: p.quote ?? null,
    logo: p.logo ?? null,
    accentColor: p.accentColor ?? null,
    offerHref,
    externalHref,
  }
}

/**
 * Re-fetch referenced offers fresh (published only) so links stay accurate even
 * on statically-cached pages, then map every partner to a ResolvedPartner.
 * (Same freshness strategy as FeaturedOffers/Component.tsx.)
 */
export async function resolvePartners(partners: RawPartner[]): Promise<ResolvedPartner[]> {
  const offerIds = partners
    .map((p) => (p.offer == null ? null : typeof p.offer === 'object' ? p.offer.id : p.offer))
    .filter((id): id is number => typeof id === 'number')

  const offerLinkById = new Map<number, string>()
  if (offerIds.length > 0) {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'offers',
      where: { id: { in: offerIds }, _status: { equals: 'published' } },
      limit: offerIds.length,
      depth: 0,
      select: { link: true },
    })
    for (const d of docs) {
      if (d.link) offerLinkById.set(d.id, d.link as string)
    }
  }

  return partners.map((p) => toResolvedPartner(p, offerLinkById))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/int/blocks/resolvePartners.int.spec.ts`
Expected: PASS (5 passing).

- [ ] **Step 5: Refactor v1 server component to use the helper**

Replace the entire contents of `src/blocks/Partners/Component.tsx` with:

```tsx
import { PartnersClient } from '@/blocks/Partners/Component.client'
import { resolvePartners } from '@/blocks/Partners/shared'
import type { PartnersBlock as PartnersBlockProps } from '@/payload-types'

export const PartnersBlock: React.FC<
  PartnersBlockProps & {
    id?: string | number
    className?: string
  }
> = async ({ badge, heading, description, rotationSeconds, partners, className }) => {
  const resolved = await resolvePartners(partners ?? [])

  return (
    <PartnersClient
      badge={badge}
      heading={heading}
      description={description ?? undefined}
      rotationSeconds={rotationSeconds ?? undefined}
      partners={resolved}
      className={className}
    />
  )
}
```

- [ ] **Step 6: Update the client's ResolvedPartner import**

`ResolvedPartner` no longer lives in `Component.tsx`. In `src/blocks/Partners/Component.client.tsx`, change line 11:

```ts
import type { ResolvedPartner } from '@/blocks/Partners/Component'
```
to:
```ts
import type { ResolvedPartner } from '@/blocks/Partners/shared'
```

- [ ] **Step 7: Verify no other stale importers of ResolvedPartner**

Run: `grep -rn "ResolvedPartner" src`
Expected: references only in `src/blocks/Partners/shared.ts`, `src/blocks/Partners/Component.client.tsx`, and (after Task 3) `src/blocks/PartnersV2/Component.tsx`. If any file still imports it from `@/blocks/Partners/Component`, update that import to `@/blocks/Partners/shared`.

- [ ] **Step 8: Lint + typecheck**

Run: `pnpm lint`
Expected: no errors. (Type check: `partners` array items structurally satisfy `RawPartner`.)

- [ ] **Step 9: Commit**

```bash
git add src/blocks/Partners/shared.ts src/blocks/Partners/Component.tsx src/blocks/Partners/Component.client.tsx tests/int/blocks/resolvePartners.int.spec.ts
git commit -m "refactor(partners): extract shared ResolvedPartner type + resolvePartners helper; v1 uses it"
```

---

## Task 3: Create the `partnersV2` block

**Files:**
- Create: `src/blocks/PartnersV2/config.ts`
- Create: `src/blocks/PartnersV2/Component.tsx`
- Modify: `src/collections/Pages/index.ts`
- Modify: `src/blocks/RenderBlocks.tsx`

- [ ] **Step 1: Write the block config**

Create `src/blocks/PartnersV2/config.ts`:

```ts
import type { Block } from 'payload'

export const PartnersV2: Block = {
  slug: 'partnersV2',
  interfaceName: 'PartnersV2Block',
  labels: {
    singular: { en: 'Partners V2', pl: 'Partnerzy V2' },
    plural: { en: 'Partners V2 Blocks', pl: 'Bloki Partnerów V2' },
  },
  fields: [
    {
      name: 'badge',
      type: 'text',
      defaultValue: 'Partnerzy',
      required: true,
      label: { en: 'Badge Text', pl: 'Tekst odznaki' },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Partnerzy Eventizera',
      required: true,
      label: { en: 'Heading', pl: 'Nagłówek' },
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Współpracujemy z zaufanymi miejscami i twórcami, którzy pomagają nam tworzyć niezapomniane wydarzenia. Poznaj naszych partnerów i sprawdź ich oferty na Eventizerze.',
      label: { en: 'Description', pl: 'Opis' },
    },
    {
      name: 'rotationSeconds',
      type: 'number',
      defaultValue: 8,
      min: 0,
      max: 60,
      label: { en: 'Spotlight rotation (seconds)', pl: 'Rotacja wyróżnienia (sekundy)' },
      admin: {
        description: {
          en: 'How long each partner stays in the spotlight. Set to 0 to disable auto-rotation.',
          pl: 'Jak długo każdy partner pozostaje w centrum uwagi. Ustaw 0, aby wyłączyć rotację.',
        },
      },
    },
    {
      name: 'partners',
      type: 'relationship',
      relationTo: 'partners',
      hasMany: true,
      required: true,
      minRows: 2,
      label: { en: 'Partners', pl: 'Partnerzy' },
      admin: {
        description: {
          en: 'Pick partners from the Partnerzy Eventizer collection. Order here = display order.',
          pl: 'Wybierz partnerów z kolekcji Partnerzy Eventizer. Kolejność tutaj = kolejność wyświetlania.',
        },
      },
    },
  ],
}
```

- [ ] **Step 2: Write the v2 server component**

Create `src/blocks/PartnersV2/Component.tsx`:

```tsx
import { PartnersClient } from '@/blocks/Partners/Component.client'
import { resolvePartners } from '@/blocks/Partners/shared'
import type { Partner, PartnersV2Block as PartnersV2BlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const PartnersV2Block: React.FC<
  PartnersV2BlockProps & {
    id?: string | number
    className?: string
  }
> = async ({ badge, heading, description, rotationSeconds, partners, className }) => {
  // The relationship may arrive as ids or expanded docs.
  const partnerIds = (partners ?? [])
    .map((p) => (typeof p === 'object' ? p.id : p))
    .filter((id): id is number => typeof id === 'number')

  if (partnerIds.length === 0) return null

  // Re-fetch the picked partners fresh (depth 1 populates the logo upload) so
  // edits in the collection appear even on statically-cached pages.
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'partners',
    where: { id: { in: partnerIds } },
    limit: partnerIds.length,
    depth: 1,
  })

  // Preserve the editor's chosen order.
  const ordered = partnerIds
    .map((id) => docs.find((d) => d.id === id))
    .filter((d): d is Partner => d != null)

  if (ordered.length === 0) return null

  const resolved = await resolvePartners(ordered)

  return (
    <PartnersClient
      badge={badge}
      heading={heading}
      description={description ?? undefined}
      rotationSeconds={rotationSeconds ?? undefined}
      partners={resolved}
      className={className}
    />
  )
}
```

- [ ] **Step 3: Register the block in the Pages config**

In `src/collections/Pages/index.ts`, add the import next to `import { Partners } from '@/blocks/Partners/config'`:

```ts
import { PartnersV2 } from '@/blocks/PartnersV2/config'
```

Then add `PartnersV2` to the `blocks: [...]` array, right after the existing `Partners` entry (~line 109):

```ts
                Partners,
                PartnersV2,
```

- [ ] **Step 4: Register the block component in RenderBlocks**

In `src/blocks/RenderBlocks.tsx`, add the import next to `import { PartnersBlock } from '@/blocks/Partners/Component'`:

```ts
import { PartnersV2Block } from '@/blocks/PartnersV2/Component'
```

Then add to the `blockComponents` map next to `partners: PartnersBlock,`:

```ts
  partners: PartnersBlock,
  partnersV2: PartnersV2Block,
```

- [ ] **Step 5: Generate types**

Run: `pnpm generate:types`
Expected: succeeds; `PartnersV2Block` interface appears in `src/payload-types.ts`, and `partnersV2` is added to the `Page['layout']` block union.

- [ ] **Step 6: Lint + typecheck**

Run: `pnpm lint`
Expected: no errors. In particular `resolvePartners(ordered)` type-checks because `Partner` structurally satisfies `RawPartner`.

- [ ] **Step 7: Commit**

```bash
git add src/blocks/PartnersV2 src/collections/Pages/index.ts src/blocks/RenderBlocks.tsx src/payload-types.ts
git commit -m "feat(partners): add partnersV2 block backed by the partners collection"
```

---

## Task 4: Schema migration (collection + block DDL)

**Files:**
- Create: `src/migrations/20260603_120000_add_partners_collection_and_v2_block.ts`
- Modify: `src/migrations/index.ts`
- Modify: `scripts/prepare-migrations.mjs`

> **Why hand-written:** the repo was bootstrapped via `payload db:push`; `pnpm payload migrate:create` would prompt about unrelated existing drift that is unsafe to bless (see the `eventizer-payload-migrations` skill). All DDL must be idempotent (`IF NOT EXISTS` / `DO $$ … duplicate_object`).
>
> **Single-relationship storage:** `logo` (upload→media) and `offer` (rel→offers) are single-target, so they store as `logo_id` / `offer_id` columns directly on `partners` (not via a `_rels` table) — see `20260523_190000_add_partners_upload_relationship_columns.ts`. The v2 block's `partners` field is `hasMany`, so it stores in `pages_rels.partners_id` / `_pages_v_rels.partners_id`.
>
> **`_order` must be `varchar`** for `orderable: true` collections (Payload writes fractional-index keys like `a0`). Creating it as `integer` is the bug `20260526_121000_fix_event_types_order_type.ts` had to remediate — get it right here.

- [ ] **Step 1: Write the migration**

Create `src/migrations/20260603_120000_add_partners_collection_and_v2_block.ts`:

```ts
// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds:
 *   • partners collection            — main rows (orderable → _order varchar)
 *       - logo_id  (upload→media)    single-target FK column
 *       - offer_id (rel→offers)      single-target FK column
 *   • partnersV2 block on Pages      — pages_blocks_partners_v2 (+ versioned mirror)
 *       - partners hasMany           via pages_rels.partners_id / _pages_v_rels.partners_id
 *   • payload_locked_documents_rels.partners_id, payload_preferences_rels.partners_id
 *
 * All DDL idempotent — safe to re-run and safe on a dev DB already updated by push.
 * Registered in ALWAYS_RUN (scripts/prepare-migrations.mjs) so Vercel builds run it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ============ 1. partners collection ============
    DO $$ BEGIN
      CREATE TYPE "public"."enum_partners_accent_color"
        AS ENUM ('primary', 'accent', 'blue', 'emerald', 'violet', 'rose');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "partners" (
      "id"           serial  PRIMARY KEY NOT NULL,
      "name"         varchar NOT NULL,
      "tagline"      varchar,
      "quote"        varchar,
      "logo_id"      integer,
      "accent_color" "public"."enum_partners_accent_color" DEFAULT 'primary',
      "offer_id"     integer,
      "external_url" varchar,
      "_order"       varchar,
      "updated_at"   timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at"   timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "partners_order_idx"     ON "partners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "partners_logo_id_idx"   ON "partners" USING btree ("logo_id");
    CREATE INDEX IF NOT EXISTS "partners_offer_id_idx"  ON "partners" USING btree ("offer_id");
    CREATE INDEX IF NOT EXISTS "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "partners_created_at_idx" ON "partners" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "partners"
        ADD CONSTRAINT "partners_logo_id_media_id_fk"
        FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "partners"
        ADD CONSTRAINT "partners_offer_id_offers_id_fk"
        FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- ============ 2. payload_locked_documents_rels.partners_id ============
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "partners_id" integer;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_partners_id_idx"
      ON "payload_locked_documents_rels" USING btree ("partners_id");
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_partners_fk"
        FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- ============ 3. payload_preferences_rels.partners_id ============
    ALTER TABLE "payload_preferences_rels"
      ADD COLUMN IF NOT EXISTS "partners_id" integer;
    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_partners_id_idx"
      ON "payload_preferences_rels" USING btree ("partners_id");
    DO $$ BEGIN
      ALTER TABLE "payload_preferences_rels"
        ADD CONSTRAINT "payload_preferences_rels_partners_fk"
        FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- ============ 4. partnersV2 block — live table ============
    CREATE TABLE IF NOT EXISTS "pages_blocks_partners_v2" (
      "_order"           integer NOT NULL,
      "_parent_id"       integer NOT NULL,
      "_path"            text    NOT NULL,
      "id"               varchar PRIMARY KEY NOT NULL,
      "badge"            varchar DEFAULT 'Partnerzy',
      "heading"          varchar DEFAULT 'Partnerzy Eventizera',
      "description"      varchar DEFAULT 'Współpracujemy z zaufanymi miejscami i twórcami, którzy pomagają nam tworzyć niezapomniane wydarzenia. Poznaj naszych partnerów i sprawdź ich oferty na Eventizerze.',
      "rotation_seconds" numeric DEFAULT 8,
      "block_name"       varchar
    );

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_partners_v2"
        ADD CONSTRAINT "pages_blocks_partners_v2_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_v2_order_idx"
      ON "pages_blocks_partners_v2" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_v2_parent_id_idx"
      ON "pages_blocks_partners_v2" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_v2_path_idx"
      ON "pages_blocks_partners_v2" USING btree ("_path");

    -- ============ 5. partnersV2 block — versioned table ============
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_partners_v2" (
      "_order"           integer NOT NULL,
      "_parent_id"       integer NOT NULL,
      "_path"            text    NOT NULL,
      "id"               serial  PRIMARY KEY NOT NULL,
      "badge"            varchar DEFAULT 'Partnerzy',
      "heading"          varchar DEFAULT 'Partnerzy Eventizera',
      "description"      varchar DEFAULT 'Współpracujemy z zaufanymi miejscami i twórcami, którzy pomagają nam tworzyć niezapomniane wydarzenia. Poznaj naszych partnerów i sprawdź ich oferty na Eventizerze.',
      "rotation_seconds" numeric DEFAULT 8,
      "_uuid"            varchar,
      "block_name"       varchar
    );

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_partners_v2"
        ADD CONSTRAINT "_pages_v_blocks_partners_v2_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_v2_order_idx"
      ON "_pages_v_blocks_partners_v2" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_v2_parent_id_idx"
      ON "_pages_v_blocks_partners_v2" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_v2_path_idx"
      ON "_pages_v_blocks_partners_v2" USING btree ("_path");

    -- ============ 6. hasMany relationship plumbing (pages_rels / _pages_v_rels) ============
    ALTER TABLE "pages_rels"    ADD COLUMN IF NOT EXISTS "partners_id" integer;
    ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "partners_id" integer;

    CREATE INDEX IF NOT EXISTS "pages_rels_partners_id_idx"
      ON "pages_rels" USING btree ("partners_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_rels_partners_id_idx"
      ON "_pages_v_rels" USING btree ("partners_id");

    DO $$ BEGIN
      ALTER TABLE "pages_rels"
        ADD CONSTRAINT "pages_rels_partners_fk"
        FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_rels"
        ADD CONSTRAINT "_pages_v_rels_partners_fk"
        FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Conservative reversal: drop the partnersV2 block tables and the partners
  // table. Leave the partners_id columns on the shared rels tables in place
  // (dropping them risks data loss if another block later reuses them).
  await db.execute(sql`
    DROP TABLE IF EXISTS "_pages_v_blocks_partners_v2";
    DROP TABLE IF EXISTS "pages_blocks_partners_v2";

    ALTER TABLE "payload_preferences_rels"      DROP CONSTRAINT IF EXISTS "payload_preferences_rels_partners_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_partners_fk";
    ALTER TABLE "pages_rels"                    DROP CONSTRAINT IF EXISTS "pages_rels_partners_fk";
    ALTER TABLE "_pages_v_rels"                 DROP CONSTRAINT IF EXISTS "_pages_v_rels_partners_fk";

    DROP TABLE IF EXISTS "partners";
    DROP TYPE  IF EXISTS "public"."enum_partners_accent_color";
  `)
}
```

- [ ] **Step 2: Register in the migrations index**

In `src/migrations/index.ts`, add the import (after the last `import * as migration_…` line):

```ts
import * as migration_20260603_120000_add_partners_collection_and_v2_block from './20260603_120000_add_partners_collection_and_v2_block';
```

And append to the `migrations` array (before the closing `]`):

```ts
  {
    up: migration_20260603_120000_add_partners_collection_and_v2_block.up,
    down: migration_20260603_120000_add_partners_collection_and_v2_block.down,
    name: '20260603_120000_add_partners_collection_and_v2_block'
  },
```

- [ ] **Step 3: Add to ALWAYS_RUN**

In `scripts/prepare-migrations.mjs`, add to the `ALWAYS_RUN` set (~line 56):

```js
  '20260603_120000_add_partners_collection_and_v2_block',
```

- [ ] **Step 4: Verify the versioned table wasn't missed**

Run: `grep -n "partners_v2\|partners_id\|enum_partners_accent_color" src/migrations/20260603_120000_add_partners_collection_and_v2_block.ts`
Expected: both `pages_blocks_partners_v2` and `_pages_v_blocks_partners_v2` present; both `pages_rels` and `_pages_v_rels` get `partners_id`.

- [ ] **Step 5: Apply the migration locally**

Run: `pnpm payload migrate`
Expected: completes without error. (Idempotent DDL — on a dev DB that already has the tables from push, every statement is a no-op; on a clean DB the tables/columns are created.)

> If `payload migrate` prompts about data loss from prior dev-push drift, this is the known local behavior described in `scripts/prepare-migrations.mjs` — answer to proceed only on your disposable dev DB, never assume that prompt in CI.

- [ ] **Step 6: Commit**

```bash
git add src/migrations/20260603_120000_add_partners_collection_and_v2_block.ts src/migrations/index.ts scripts/prepare-migrations.mjs
git commit -m "feat(partners): schema migration for partners collection + partnersV2 block"
```

---

## Task 5: Seed migration (10 homepage partners, auto-link offers)

**Files:**
- Create: `src/migrations/20260603_120500_seed_partners.ts`
- Modify: `src/migrations/index.ts`
- Modify: `scripts/prepare-migrations.mjs`

> Uses the Payload **local API** (`payload` / `req` are provided in `MigrateUpArgs`) rather than raw SQL, so the `offer` relationship resolves by the offer's stable `link` slug across environments. Idempotent on partner `name`. Offer lookup returns `null` when the offer doesn't exist in the current DB (e.g. a fresh local DB), so the migration never fails.

- [ ] **Step 1: Write the seed migration**

Create `src/migrations/20260603_120500_seed_partners.ts`:

```ts
// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-vercel-postgres'

/**
 * Seeds the partners collection with the 10 partners that were inline on the
 * homepage (Page 4) as of 2026-06-03. Idempotent on `name`: re-running won't
 * duplicate, and won't overwrite admin edits.
 *
 * `offer` is wired by looking the offer up via its stable `link` slug, so the
 * relationship resolves correctly in any environment that has the offer; when
 * absent (e.g. a fresh local DB), the partner is created with offer = null.
 * Logos are left null (none existed on the homepage; upload via panel later).
 */
const PARTNERS = [
  {
    name: 'SkyClub Białystok',
    tagline: 'Klub muzyczny · Białystok',
    accentColor: 'primary',
    externalUrl: 'https://sky-club.pl/',
    offerLink: 'SkyBialystok',
    quote:
      'Sky Club jest miejscem, w którym zabawa jest zawsze wspaniała. Nasz ekskluzywny klub powstał dla ludzi lubiących spędzać czas na parkiecie w doborowym towarzystwie. Lepiej nie trafisz!',
  },
  {
    name: 'Meetly',
    tagline: 'E-zaproszenia online',
    accentColor: 'blue',
    externalUrl: 'https://meetly.com.pl/',
    offerLink: null,
    quote: 'Najpiękniejsze zaproszenia online\nZ inteligentnym RSVP. Bez papieru w niecałą minutę.',
  },
  {
    name: 'Apartamenty Zielona Lipka',
    tagline: 'Mazury · jezioro Roś',
    accentColor: 'emerald',
    externalUrl: 'https://zielonalipka.pl/',
    offerLink: 'apartamenty-zielona-lipka',
    quote:
      'Apartamenty Zielona Lipka w Piszu to komfortowy wypoczynek nad jeziorem Roś na Mazurach. Obiekt oferuje nowoczesne apartamenty, taras oraz saunę, zapewniając idealne warunki do relaksu blisko natury.',
  },
  {
    name: 'Apartamenty pod Gromadzyniem',
    tagline: 'Bieszczady · Ustrzyki Dolne',
    accentColor: 'violet',
    externalUrl: 'https://www.facebook.com/apartamentypodgromadzyniem/',
    offerLink: 'apartamentypodgromadzyniem',
    quote:
      'Piękne Apartamenty pod Gromadzyniem. Basen, Sauna, Jacuzzi - wszystko czego potrzebujesz, żeby odpocząć i nabrać świeżego powietrza w pięknych Bieszczadzkich górach.',
  },
  {
    name: 'Princess Palace Gdańsk',
    tagline: 'Willa eventowa · Gdańsk',
    accentColor: 'rose',
    externalUrl: 'https://princesspalace.pl/',
    offerLink: 'princess-palace-gdansk',
    quote:
      'Princess Palace w Gdańsku to ekskluzywna willa na wyłączność, oferująca niezapomniane doświadczenia w tematycznych wnętrzach inspirowanych różnymi kulturami.',
  },
  {
    name: 'DJ SPDR',
    tagline: 'Muzyka i rozrywka',
    accentColor: 'accent',
    externalUrl: null,
    offerLink: 'Spdrofficial',
    quote:
      '20 lat doświadczenia jako DJ. Obecnie studiuje produkcję muzyki i DJing na Middlesex University w Londynie.',
  },
  {
    name: 'Misiak Events',
    tagline: 'Agencja eventowa · Kielce',
    accentColor: 'blue',
    externalUrl: 'https://www.facebook.com/misiak.events/',
    offerLink: 'nowa-oferta-2603-111740',
    quote:
      'Misiak Events – fotobudka, ciężki dym, iskry i napisy LED. Tworzymy efekt WOW na Twoim wydarzeniu',
  },
  {
    name: 'Wesela na głowie',
    tagline: 'Agencja eventowa · Tłuszcz',
    accentColor: 'emerald',
    externalUrl: 'https://www.instagram.com/wesele_na_glowie/',
    offerLink: 'Weselenaglowie',
    quote:
      'Wesele na Głowie – kompleksowa oprawa wesel i eventów. Efekty specjalne, atrakcje, foto & video oraz wyjątkowe momenty, które tworzą niezapomniane wydarzenia.',
  },
  {
    name: 'Santiago Events',
    tagline: 'Agencja eventowa · Płocochowo',
    accentColor: 'rose',
    externalUrl: 'https://www.instagram.com/santiago_eventss?igsh=OTBuenI0d2ozbTRl',
    offerLink: 'santiago-events',
    quote:
      'Santiago Events – fotobudka 360, fotolustro, budka telefoniczna, telefon życzeń i spektakularne fotostrefy LED. Tworzymy efekt WOW na każdym evencie.',
  },
  {
    name: 'Na Łośmiu Metrach',
    tagline: 'Domek na drzewie · Białystok',
    accentColor: 'accent',
    externalUrl: 'https://www.instagram.com/na_losmiu_metrach/',
    offerLink: 'nalosmiumetrach',
    quote: 'Domek na drzewie - Na Łośmiu Metrach. Najpiękniejsze Osiem metrów w Polsce.',
  },
]

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const p of PARTNERS) {
    const existing = await payload.find({
      collection: 'partners',
      where: { name: { equals: p.name } },
      limit: 1,
      req,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) continue

    let offer = null
    if (p.offerLink) {
      const found = await payload.find({
        collection: 'offers',
        where: { link: { equals: p.offerLink } },
        limit: 1,
        req,
        overrideAccess: true,
      })
      offer = found.docs[0]?.id ?? null
      if (!offer) {
        payload.logger.info(`[seed_partners] offer "${p.offerLink}" not found — ${p.name} seeded without link`)
      }
    }

    await payload.create({
      collection: 'partners',
      data: {
        name: p.name,
        tagline: p.tagline,
        quote: p.quote,
        accentColor: p.accentColor,
        externalUrl: p.externalUrl ?? undefined,
        offer,
      },
      req,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  // Delete only the seeded partners (by name); leave admin-created ones alone.
  for (const p of PARTNERS) {
    const existing = await payload.find({
      collection: 'partners',
      where: { name: { equals: p.name } },
      limit: 100,
      req,
      overrideAccess: true,
    })
    for (const doc of existing.docs) {
      await payload.delete({
        collection: 'partners',
        id: doc.id,
        req,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
    }
  }
}
```

- [ ] **Step 2: Register in the migrations index**

In `src/migrations/index.ts`, add the import:

```ts
import * as migration_20260603_120500_seed_partners from './20260603_120500_seed_partners';
```

And append to the `migrations` array (after the schema migration entry from Task 4):

```ts
  {
    up: migration_20260603_120500_seed_partners.up,
    down: migration_20260603_120500_seed_partners.down,
    name: '20260603_120500_seed_partners'
  },
```

- [ ] **Step 3: Add to ALWAYS_RUN**

In `scripts/prepare-migrations.mjs`, add to the `ALWAYS_RUN` set (after the schema migration line):

```js
  '20260603_120500_seed_partners',
```

- [ ] **Step 4: Run the seed locally and verify**

Run: `pnpm payload migrate`
Expected: completes. Then verify the rows (adjust connection var to match your env — the script uses `POSTGRES_URL`/`DATABASE_URI`):

Run: `pnpm payload migrate:status`
Expected: `20260603_120500_seed_partners` shows as applied.

Then start the app and check the admin panel:

Run: `pnpm dev`
- Navigate to the admin → "Partnerzy Eventizer" collection.
- Expected: 10 partners. On a DB that contains the referenced offers, 9 have an Offer set (Meetly has none). On a fresh local DB without those offers, partners are present with empty Offer — that is expected (prod links them).

- [ ] **Step 5: Verify idempotency + down**

Run: `pnpm payload migrate:down` then `pnpm payload migrate`
Expected: `down` removes exactly the 10 seeded partners; re-running `migrate` recreates them with no duplicates. (If `migrate:down` rolls back more than this migration in your setup, run it once and confirm the 10 partners are gone, then re-apply.)

- [ ] **Step 6: Commit**

```bash
git add src/migrations/20260603_120500_seed_partners.ts src/migrations/index.ts scripts/prepare-migrations.mjs
git commit -m "feat(partners): seed 10 homepage partners, auto-linking offers by slug"
```

---

## Task 6: Full verification + Mind maintenance

**Files:**
- Modify: `eventizer-mind/map/zones/content-blocks.md`
- Create: `eventizer-mind/map/decisions/partners-promoted-to-collection.md`

- [ ] **Step 1: Full typecheck + lint + tests**

Run: `pnpm generate:types && pnpm lint && pnpm test:int`
Expected: types generate clean, lint passes, integration tests (including `resolvePartners.int.spec.ts`) pass.

- [ ] **Step 2: Render-parity smoke test**

Run: `pnpm dev`
- On a scratch/draft Page, add a **Partnerzy V2** block, set badge/heading/description, and pick several seeded partners.
- Expected: the carousel renders **identically** to the homepage v1 Partners block — spotlight auto-rotation, accent colors, avatar picker, "Zobacz ofertę" (for partners whose offer is set + published) and "Odwiedź stronę" buttons, and the bottom name strip.
- Confirm the **homepage** (v1 block) still renders unchanged.

- [ ] **Step 3: Revalidation check**

- In the admin, edit a seeded partner's `quote`; save.
- Reload the scratch page using the V2 block.
- Expected: the new quote appears (the collection `afterChange` hook revalidated `/`).

- [ ] **Step 4: Update the content-blocks zone card**

In `eventizer-mind/map/zones/content-blocks.md`:
- Add `Partners` (collection) and `PartnersV2` to the block-library prose.
- Under `owns.globs`, add `src/collections/Partners.ts`.
- Re-stamp `verifiedAt` to the new HEAD:

Run: `git rev-parse HEAD` and paste the value into the `verifiedAt:` field.

- [ ] **Step 5: Add the decision record**

Create `eventizer-mind/map/decisions/partners-promoted-to-collection.md` documenting: why partners moved from an inline block array to a collection (cross-page reuse / single source of truth), why v1 + v2 coexist (no page edits, additive rollout), and that the v2 block reuses the v1 carousel via the shared `resolvePartners` helper.

- [ ] **Step 6: Regenerate the Mind index**

Run: `pnpm mind:check`
Expected: regenerates `eventizer-mind/map/index.md` with no validation errors.

- [ ] **Step 7: Final commit**

```bash
git add eventizer-mind/
git commit -m "docs(mind): record partners collection + partnersV2 in content-blocks zone"
```

---

## Self-review checklist (completed by plan author)

- **Spec coverage:** collection (Task 1) ✓ · shared resolver + v1 refactor (Task 2) ✓ · v2 block + registration (Task 3) ✓ · schema migration with ALWAYS_RUN (Task 4) ✓ · auto-linking seed (Task 5) ✓ · "no page edits / v1 stays" honored (no Pages or v1 config touched) ✓ · Mind maintenance (Task 6) ✓.
- **Type consistency:** `ResolvedPartner` / `RawPartner` / `toResolvedPartner` / `resolvePartners` names are used identically across `shared.ts`, the test, v1 `Component.tsx`, and v2 `Component.tsx`. Block interfaceName `PartnersV2Block` matches the import in `Component.tsx` and `RenderBlocks.tsx`. Collection slug `partners` matches `relationTo: 'partners'`, the migration table name, and the seed `collection: 'partners'`.
- **Migration correctness:** `_order` is `varchar` (orderable bug avoided); both live + versioned block tables created; `partners_id` added to `pages_rels` + `_pages_v_rels` + `payload_locked_documents_rels` + `payload_preferences_rels`; both migrations added to `ALWAYS_RUN`; seed timestamp (`120500`) sorts after schema (`120000`).
- **No placeholders:** every step has concrete code/commands; the 10 seed quotes are transcribed verbatim.
- **Naming clash check:** block slug `partnersV2` vs collection slug `partners` are distinct, and both differ from v1 block slug `partners` — verified safe at build via `generate:types` (Task 3 Step 5).
```
