# Event Types (Rodzaje Eventów) — Design

**Date:** 2026-05-26
**Status:** Approved for implementation planning (v2 — switched to pure relationship after Postgres-storage check)
**Areas:** `/panel/oferty/*` (wizard), `/ogloszenia` (listings), Payload (new collection)

## 1. Problem

Today an offer is classified only by its hierarchical service category (e.g. *Muzyka i rozrywka → DJ → DJ Weselny*). That answers "what service is this?" but not "what kind of event is it for?" — and clients shop by event first (wedding, corporate party, birthday) more often than by service taxonomy.

We need a second, flat classification — *Rodzaj eventu* — that:

- An offer can belong to many of (a DJ is plausibly for weddings AND birthdays AND corporate)
- Defaults to "all" for both new and existing offers (so no provider is silently invisible after rollout)
- Has icons (uploaded via the existing media collection, consistent with `ServiceCategories`)
- Surfaces as a filter on `/ogloszenia`

## 2. Default semantics (the central decision)

Two related rules, picked deliberately:

1. **New offers start with every active event type pre-checked.** The provider opts *out* of types that don't apply rather than opting in.
2. **Empty/null `eventTypes` on an offer is treated as "matches all"** for filtering. This protects all offers that existed before this feature shipped — no backfill migration on `offers` needed.

These rules together mean: for filtering, *no offer is ever hidden because the field is new*. Providers who never touch the field stay visible everywhere; providers who curate their list narrow themselves down.

The wizard surfaces "selected = N of M" copy so providers understand the curation gesture.

## 3. New collection: `event-types`

| Field         | Type                              | Notes                                                       |
| ------------- | --------------------------------- | ----------------------------------------------------------- |
| `name`        | text, required                    | `pl`/`en` labels on the field                               |
| `slug`        | text, required, unique, indexed   | sidebar; admin description like ServiceCategories           |
| `icon`        | upload → `media`, optional        | Same shape as `ServiceCategories.icon`                      |
| `description` | textarea, optional                | Internal/admin help text                                    |
| `isActive`    | checkbox, default `true`          | Soft-hide without deleting; wizard/filter only show active  |

Collection config:

- `slug: 'event-types'`
- `labels`: `{ singular: { pl: 'Rodzaj eventu', en: 'Event Type' }, plural: { pl: 'Rodzaje eventów', en: 'Event Types' } }`
- `orderable: true` — admins reorder via drag handles in the admin list
- `admin: { useAsTitle: 'name', group: adminGroups.settings, defaultColumns: ['name', 'slug', 'isActive'], hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user) }`
- `access: { read: () => true, create/update/delete: admin-only }` — reads must be public because both the listing strip and offer detail page may render them server-side without an authenticated session
- `hooks.afterChange` + `afterDelete`: `revalidatePath('/', 'layout')` (mirrors `ServiceCategories`)

### 3.1 Seeded defaults

A migration (`src/migrations/<timestamp>_seed_event_types.ts`) inserts the 11 defaults if they don't already exist (idempotent by slug):

| Name                          | Slug                            |
| ----------------------------- | ------------------------------- |
| Wesele                        | `wesele`                        |
| Event firmowy                 | `event-firmowy`                 |
| Urodziny                      | `urodziny`                      |
| Impreza prywatna              | `impreza-prywatna`              |
| Wieczór kawalerski / panieński | `wieczor-kawalerski-panienski`  |
| Studniówka / bal              | `studniowka-bal`                |
| Chrzciny / komunie            | `chrzciny-komunie`              |
| Konferencja / gala            | `konferencja-gala`              |
| Festiwal / event masowy       | `festiwal-event-masowy`         |
| Sesja foto / produkcja        | `sesja-foto-produkcja`          |
| Inne                          | `inne`                          |

Seed leaves `icon` empty; admin uploads icons after deploy. The wizard and filter strip render a `Sparkles` lucide fallback when `icon` is null, so the feature is fully functional before icons are uploaded.

## 4. Schema changes on `offers`

One new field on `Offers`, plus the relationship-link columns that Payload's Postgres adapter requires for `hasMany` relationships. Per the `eventizer-payload-migrations` skill, the DDL must be hand-written as an idempotent migration before deploy so Vercel builds don't crash on missing columns when `/pl` SSGs query offers.

- `eventTypes` — `relationship`, `hasMany: true`, `relationTo: 'event-types'`, optional. `filterOptions: () => ({ isActive: { equals: true } })`. Placed right after the existing `category` text field in `Offers/fields.ts`. Admin description: "Pozostaw puste, aby oferta pojawiała się dla wszystkich rodzajów eventów."

`defaultPopulate` on `Offers` gains `eventTypes: true` so the listing card and detail page can render them at the standard depth.

### 4.1 No denormalization, no extra hook

An earlier draft denormalized event-type slugs onto the offer to "avoid a JOIN at filter time". On Payload's Vercel Postgres adapter, both `relationship hasMany: true` and `text hasMany: true` are stored in child tables — the JOIN happens either way. Denormalization here would only add a maintenance hook (`populateEventTypeSlugs`) and a slug-drift bug (renaming an event type leaves stale rows on every offer until next save) with **zero** measurable benefit. We don't do it.

Filtering reads through the relationship directly via Payload's nested syntax: `{ 'eventTypes.slug': { equals: rodzaj } }` (see §6.4). Slug renames propagate instantly because the value is read live from `event_types.slug`.

### 4.2 "Empty = all" with no hook

The "empty selection = matches all rodzaj filters" semantics is enforced entirely in the listing query (§6.4) using Payload's `exists` operator on the relationship. We do not normalize empty arrays to `null` in a hook — `{ eventTypes: { exists: false } }` matches both rows that have never had a related event-type AND rows whose relationship has been cleared, because Payload's `exists` on a `hasMany` relationship checks whether any link row is present.

If a provider deselects every chip in the wizard, the offer is treated identically to legacy offers — visible under every `rodzaj` filter. This is intentional. If the product later wants "intentionally hidden from rodzaj filters" as a distinct state, it should be a separate explicit toggle rather than overloading "all unchecked".

## 5. Wizard UX — `StepBasicInfo`

A new `EventTypePicker` component (sibling to `CategoryPicker`) is rendered directly below the category field in `StepBasicInfo`.

### 5.1 Component

`src/components/panel/wizard/EventTypePicker.tsx`:

```ts
interface EventTypeItem {
  id: number
  name: string
  slug: string
  icon?: { url?: string } | number | null
}

interface EventTypePickerProps {
  eventTypes: EventTypeItem[]   // active types, sorted by `order`
  value: number[]               // selected IDs
  onChange: (ids: number[]) => void
}
```

Layout:

- Wrap-flex grid of toggleable chip-cards (same visual family as `CategoryPicker` cards: `rounded-xl`, `bg-background`, `border`, hover-lift via motion).
- Each chip: 28×28 icon (next/image of `icon.url` with `Sparkles` lucide fallback) + Polish name.
- Selected = filled copper accent (`border-primary/40 bg-primary/5`), small `Check` top-right. Unselected = muted border.
- `whileHover={{ y: -2 }}` with the existing `snappySpring`; reduced-motion path drops the transform.
- Below the grid: two ghost buttons "Wybierz wszystkie" / "Odznacz wszystkie", and a counter `Wybrano N z M rodzajów` with `aria-live="polite"`.

### 5.2 Form wiring

- `offerSchema` (and `stepSchemas[0]`) gain `eventTypes: z.array(z.number()).optional().default([])`.
- `OfferWizardForm` accepts `eventTypes` prop (the full list, fetched server-side).
  - **Create flow:** `defaultValues.eventTypes = eventTypes.map(t => t.id)` — all active types pre-checked.
  - **Edit flow:** hydrate from the loaded offer. Payload may return IDs (depth 0) or full docs (depth 2); normalize: `Array.isArray(offer.eventTypes) ? offer.eventTypes.map(t => (typeof t === 'object' ? t.id : t)) : []`.
- On submit, `offerData.eventTypes` is sent as `number[]` to the server action.
- No step-gating validation. No publish-time guard (empty is valid).

### 5.3 Server-side data fetch

`panel/oferty/nowa/page.tsx` and `panel/oferty/[slug]/edytuj/page.tsx` already fetch `service-categories`. Each gains a parallel:

```ts
payload.find({
  collection: 'event-types',
  where: { isActive: { equals: true } },
  sort: 'order',
  limit: 0,
})
```

…and threads the docs through `OfferWizardForm` → `StepBasicInfo` → `EventTypePicker`.

### 5.4 Server actions (`src/actions/panel/offers.ts`)

`createOffer` and `updateOffer` accept an `eventTypes?: number[]` field on their input type and forward it to the Payload create/update call. Existing draft/published dispatch and revalidation logic is unchanged.

## 6. Listings UX — `/ogloszenia`

### 6.1 URL parameter

A new `rodzaj` search param. Single value (one slug). Reset to "all" by removing the param.

- `OfferSearchParams` + `ParsedSearchParams` (`ListView/types.ts`) gain `rodzaj?: string`.
- `parseSearchParams` (`parseParams.ts`) passes `rodzaj` through unchanged.
- `ogloszenia/page.tsx` reads `searchParams.rodzaj` and forwards it to `ListView`.

### 6.2 `EventTypeStrip` component

`src/app/(frontend)/[lang]/ogloszenia/ListView/EventTypeStrip/index.tsx`. Rendered between `SearchBar` and `OffersView`.

- Horizontally scrollable on mobile (`overflow-x-auto`, `snap-x`, edge fade masks); wraps on `lg+`.
- One chip per active event type, plus an "Wszystkie" pseudo-chip on the left (selected when `rodzaj` is absent).
- Selected chip = filled copper; unselected = muted outline. 20×20 icon + name.
- Clicking a chip uses `useListViewTransition().startTransition` + `router.push` to set/clear `?rodzaj=<slug>` (preserving other params, clearing `strona`).

### 6.3 Server-side fetch

`ListView/index.tsx` fetches active event types alongside the offer query (parallel `Promise.all`), so the strip renders without a client roundtrip. Types are passed to both the strip and `ActiveFilters` (for the badge label lookup).

### 6.4 Query — `buildBaseConditions`

In `ListView/utils/conditions.ts`, when `params.rodzaj` is set:

```ts
conditions.push({
  or: [
    { 'eventTypes.slug': { equals: params.rodzaj } },
    { eventTypes: { exists: false } },
  ],
})
```

That single `or` block expresses "the offer is tagged with this rodzaj, OR the offer has no event-type relations at all" — preserving the legacy-offer guarantee from §2 with no migration on existing offer rows.

### 6.5 `ActiveFilters` badge

`ActiveFilters/index.tsx` gains a new badge entry:

- Reads `searchParams.get('rodzaj')`.
- Looks up the matching `EventTypeItem` from a new `eventTypes` prop passed by `SearchBar`.
- Renders the type's name as label, `Sparkles` lucide fallback icon. Same `FilterBadge` styling and `removeParam('rodzaj')` behavior as siblings.

### 6.6 Out of scope for v1

- Multi-select on the strip. The chosen UX is single-select; if usage shows providers wanting AND-logic across types, revisit.
- Showing the selected event-type chips on `OfferListCard`. We can layer this in later — the data is in `defaultPopulate`, so no schema change is needed.
- Filtering on offer detail page (`/ogloszenia/[slug]`) — the field exists in the response but no new UI on that page in v1.

## 7. File touchpoints

**New files**
- `src/collections/EventTypes.ts`
- `src/components/panel/wizard/EventTypePicker.tsx`
- `src/app/(frontend)/[lang]/ogloszenia/ListView/EventTypeStrip/index.tsx`
- `src/migrations/<timestamp>_add_event_types.ts` (DDL: new `event_types` table + relationship columns on `offers_rels` / `_offers_v_rels` / locked-docs / preferences rels tables)
- `src/migrations/<timestamp>_seed_event_types.ts` (data seed, idempotent on slug)

**Modified files**
- `src/payload.config.ts` — register `EventTypes` in `collections`
- `src/migrations/index.ts` — re-export both new migrations
- `scripts/prepare-migrations.mjs` — add both new migration names to `ALWAYS_RUN`
- `src/collections/Offers/fields.ts` — add `eventTypes` relationship field
- `src/collections/Offers/index.ts` — expand `defaultPopulate` with `eventTypes`
- `src/components/panel/wizard/offerSchema.ts` — extend `offerSchema` and `stepSchemas[0]`
- `src/components/panel/wizard/OfferWizardForm.tsx` — thread `eventTypes` prop, default values, edit hydration, submit payload, pass to `StepBasicInfo`
- `src/components/panel/wizard/steps/StepBasicInfo.tsx` — render `EventTypePicker`
- `src/app/(frontend)/[lang]/panel/oferty/nowa/page.tsx` — fetch event types
- `src/app/(frontend)/[lang]/panel/oferty/[slug]/edytuj/page.tsx` — fetch event types
- `src/app/(frontend)/[lang]/ogloszenia/page.tsx` — read `rodzaj`, forward
- `src/app/(frontend)/[lang]/ogloszenia/ListView/index.tsx` (+ `.client.tsx`) — fetch + pass event types, render `EventTypeStrip`
- `src/app/(frontend)/[lang]/ogloszenia/ListView/types.ts` — add `rodzaj`
- `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/parseParams.ts` — pass through `rodzaj`
- `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/conditions.ts` — add the `or`-with-`exists` block
- `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/index.tsx` — accept `eventTypes` prop, forward to `ActiveFilters`
- `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/ActiveFilters/index.tsx` — render rodzaj badge
- `src/payload-types.ts` — regenerate via `pnpm generate:types`

**Note on server actions (`src/actions/panel/offers.ts`):** `createOffer` / `updateOffer` both accept `Partial<Offer>` and spread it into the Payload call. Once `payload-types.ts` is regenerated, `eventTypes` becomes part of `Offer` and flows through without code change. Verify in Task 9 of the plan.

## 8. Risks & validation

- **Build risk on Vercel.** Schema change adds one table + relationship columns on four `_rels` tables. Per `eventizer-payload-migrations`, hand-write idempotent ALTERs (with `IF NOT EXISTS`) and register the migration in both `src/migrations/index.ts` and the `ALWAYS_RUN` set in `scripts/prepare-migrations.mjs` so Vercel actually runs it instead of pre-marking it applied. Without this, `/pl` SSG fails on "column does not exist".
- **Slug drift.** None — filter reads slugs live from `event_types.slug` via the relationship join. Renaming an event type's slug propagates instantly to listings.
- **Seed idempotency.** The seed migration uses `INSERT … ON CONFLICT (slug) DO NOTHING` so re-running on a populated DB is safe. Inactive types are not re-activated by the seed (i.e. the seed doesn't `UPDATE`).
- **Listing performance.** Filter adds one LEFT JOIN to `offers_rels → event_types` plus an OR with `exists` on the same relation. Comparable to today's `categorySlug` filter; should be neutral.
- **Hydration mismatch on edit.** `eventTypes` may come back as IDs or as expanded docs depending on `depth`; the normalization in §5.2 handles both. Test the edit flow specifically with `depth: 2` (current default in `getOffer`).

## 9. Manual test checklist (post-implementation)

- Create new offer; confirm all 11 event types pre-checked; deselect 2; publish; verify the relationship rows in `offers_rels` reflect the selection.
- Edit existing pre-feature offer; confirm zero selected; save without changing; verify it still appears under every `?rodzaj=` filter (the `exists: false` branch).
- Filter `/ogloszenia?rodzaj=wesele`; verify an offer appears iff at least one of its event types has slug `wesele` OR it has no event types at all.
- Combine with `?kategoria=muzyka-rozrywka/dj`; verify both predicates AND.
- Toggle a type to `isActive: false` in admin; verify it disappears from the wizard picker and the strip but existing tagged offers are unaffected.
- Rename an event type's slug in admin; reload `/ogloszenia?rodzaj=<new-slug>`; verify previously-tagged offers immediately match the new slug (no offer-side resave needed).
- Reduced-motion: toggle OS pref; verify chip hover does not animate.
- Mobile: confirm the strip scrolls horizontally with snap and fade masks; the wizard chips wrap.
