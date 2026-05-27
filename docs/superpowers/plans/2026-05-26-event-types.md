# Event Types (Rodzaje Eventów) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a flat, multi-select "rodzaj eventu" (event-type) classification to offers, surfaced as a wizard picker below the category field and a filter chip strip on `/ogloszenia`.

**Architecture:** New `event-types` Payload collection with media-uploaded icons. Offers gain an optional `hasMany` relationship to it; empty/unset = "matches all" semantics enforced at the query layer via `exists: false`. No denormalization. Wizard pre-selects all active types on create; legacy offers stay null and remain visible under every filter without migration.

**Tech Stack:** Payload CMS 3.75, Next.js 16 App Router, Vercel Postgres + Drizzle, TypeScript, React Hook Form + Zod, Tailwind v4, motion/react, lucide-react, shadcn/ui.

**Spec:** [docs/superpowers/specs/2026-05-26-event-types-design.md](../specs/2026-05-26-event-types-design.md)

---

## File Structure

**New files (5):**

| Path | Responsibility |
| --- | --- |
| `src/collections/EventTypes.ts` | Payload collection config — name/slug/icon/description/isActive, public read, admin write, revalidate hooks |
| `src/migrations/20260526_120000_add_event_types.ts` | Hand-written idempotent DDL: new `event_types` table + `event_types_id` columns on the four `_rels` tables |
| `src/migrations/20260526_120500_seed_event_types.ts` | Idempotent INSERT of the 11 default rows |
| `src/components/panel/wizard/EventTypePicker.tsx` | Wizard chip-grid component, RHF-controlled |
| `src/app/(frontend)/[lang]/ogloszenia/ListView/EventTypeStrip/index.tsx` | Listings horizontal chip strip, URL-param driven |

**Modified files (17):**

| Path | Change |
| --- | --- |
| `src/payload.config.ts` | Register `EventTypes` in `collections` array (after `ServiceCategories`) |
| `src/migrations/index.ts` | Re-export both new migrations in order |
| `scripts/prepare-migrations.mjs` | Add both new migration names to `ALWAYS_RUN` |
| `src/collections/Offers/fields.ts` | Add `eventTypes` relationship field after `category` |
| `src/collections/Offers/index.ts` | Add `eventTypes: true` to `defaultPopulate` |
| `src/components/panel/wizard/offerSchema.ts` | Add `eventTypes: z.array(z.number()).optional().default([])` to `offerSchema` and `stepSchemas[0]` |
| `src/components/panel/wizard/OfferWizardForm.tsx` | Accept `eventTypes` prop, thread defaults / hydration / submit / render |
| `src/components/panel/wizard/steps/StepBasicInfo.tsx` | Render `<EventTypePicker>` below the category field |
| `src/app/(frontend)/[lang]/panel/oferty/nowa/page.tsx` | Fetch event types in parallel with categories |
| `src/app/(frontend)/[lang]/panel/oferty/[slug]/edytuj/page.tsx` | Fetch event types in parallel with categories |
| `src/app/(frontend)/[lang]/ogloszenia/page.tsx` | Read `rodzaj` from search params, forward to `ListView` |
| `src/app/(frontend)/[lang]/ogloszenia/ListView/types.ts` | Add `rodzaj` to `OfferSearchParams` and `ParsedSearchParams` |
| `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/parseParams.ts` | Pass `rodzaj` through |
| `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/conditions.ts` | Add the `or` block with `exists: false` |
| `src/app/(frontend)/[lang]/ogloszenia/ListView/index.tsx` | Fetch active event types, pass to client view |
| `src/app/(frontend)/[lang]/ogloszenia/ListView/index.client.tsx` | Accept event types + `currentRodzaj`, render `EventTypeStrip`, forward to SearchBar |
| `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/index.tsx` | Accept `eventTypes` + `currentRodzaj`, forward to `ActiveFilters` |
| `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/ActiveFilters/index.tsx` | Render rodzaj badge with lookup-by-slug |

**Regenerated (1):** `src/payload-types.ts` (via `pnpm generate:types`).

**Test files (1):**

| Path | What it tests |
| --- | --- |
| `tests/int/lib/eventTypeConditions.int.spec.ts` | `buildBaseConditions` correctly emits the `or` with `exists: false` when `rodzaj` is set, and omits the block when not |

---

## Task 1: Create `EventTypes` collection

**Files:**
- Create: `src/collections/EventTypes.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create the collection file**

```ts
// src/collections/EventTypes.ts
import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { revalidatePath } from 'next/cache'
import {
  CollectionConfig,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import type { EventType } from '@/payload-types'

const revalidateEventTypes: CollectionAfterChangeHook<EventType> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  payload.logger.info(
    `Revalidating all pages — event type ${doc.id} ("${doc.name}") changed`,
  )
  revalidatePath('/', 'layout')

  return doc
}

const revalidateEventTypesOnDelete: CollectionAfterDeleteHook<EventType> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  payload.logger.info(`Revalidating all pages — event type ${doc.id} was deleted`)
  revalidatePath('/', 'layout')

  return doc
}

export const EventTypes: CollectionConfig = {
  slug: 'event-types',
  labels: {
    singular: { en: 'Event Type', pl: 'Rodzaj eventu' },
    plural: { en: 'Event Types', pl: 'Rodzaje eventów' },
  },
  orderable: true,
  admin: {
    useAsTitle: 'name',
    group: adminGroups.settings,
    defaultColumns: ['name', 'slug', 'isActive'],
    hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user),
    description: {
      en: 'Event types an offer can serve (wedding, corporate, etc.). Used by the offer wizard and the public listings filter.',
      pl: 'Rodzaje eventów, dla których oferta jest przeznaczona (wesele, event firmowy, itp.). Używane przez kreator oferty oraz filtr na publicznej liście ogłoszeń.',
    },
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => isClientRoleEqualOrHigher('admin', user),
    update: ({ req: { user } }) => isClientRoleEqualOrHigher('admin', user),
    delete: ({ req: { user } }) => isClientRoleEqualOrHigher('admin', user),
  },
  hooks: {
    afterChange: [revalidateEventTypes],
    afterDelete: [revalidateEventTypesOnDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { en: 'Name', pl: 'Nazwa' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: {
        position: 'sidebar',
        description: {
          en: "Unique identifier (e.g., 'wesele'). Used in the public URL filter `?rodzaj=`.",
          pl: "Unikalny identyfikator (np. 'wesele'). Używany w filtrze URL `?rodzaj=`.",
        },
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Icon', pl: 'Ikona' },
      admin: {
        description: {
          en: 'Optional icon image. Falls back to a Sparkles glyph when empty.',
          pl: 'Opcjonalna ikona. Gdy puste, wyświetlana jest domyślna ikona Sparkles.',
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', pl: 'Opis' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      label: { en: 'Active', pl: 'Aktywny' },
      admin: {
        position: 'sidebar',
        description: {
          en: 'When unchecked, hidden from the wizard picker and the listings filter. Existing offers tagged with this type keep the tag.',
          pl: 'Po odznaczeniu znika z kreatora oferty i z filtra ogłoszeń. Istniejące oferty z tym rodzajem zachowują przypisanie.',
        },
      },
    },
  ],
}
```

- [ ] **Step 2: Register the collection in `payload.config.ts`**

In `src/payload.config.ts`, add the import alongside `ServiceCategories`:

```ts
import { ServiceCategories } from '@/collections/ServiceCategories'
import { EventTypes } from '@/collections/EventTypes'
```

And in the `collections` array, add `EventTypes` directly after `ServiceCategories`:

```ts
collections: [
  // Website
  Pages,

  // Marketplace
  Offers,

  // Auth
  Users,
  Sessions,
  Accounts,
  Verifications,

  // Settings
  ServiceCategories,
  EventTypes,
  SubscriptionPlans,
  StripeCustomers,
  ProcessedStripeEvents,

  // ... rest unchanged
```

- [ ] **Step 3: Regenerate Payload types**

```bash
pnpm generate:types
```

Expected: succeeds with no error; `src/payload-types.ts` now exports an `EventType` interface and adds `'event-types'` to the `Config['collections']` map.

- [ ] **Step 4: Verify in dev**

```bash
pnpm dev
```

Open `http://localhost:3000/app`. Expected:
- A new "Rodzaje eventów" entry under the Ustawienia admin group.
- Creating a doc with name "Wesele" + slug "wesele" succeeds; creating a second doc with slug "wesele" fails the unique constraint.

Stop the dev server before moving on.

- [ ] **Step 5: Commit**

```bash
git add src/collections/EventTypes.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat(event-types): add EventTypes collection (name, slug, icon, isActive)"
```

---

## Task 2: Add schema migration for `event_types` table and relationship columns

**Files:**
- Create: `src/migrations/20260526_120000_add_event_types.ts`
- Modify: `src/migrations/index.ts`, `scripts/prepare-migrations.mjs`

**Context:** Payload's Vercel Postgres adapter stores `hasMany` relationships in `<collection>_rels` tables with one column per related collection. Since we're adding a new collection AND a new `eventTypes hasMany` relationship on Offers (Task 4 below), we need:

1. The `event_types` table itself.
2. `event_types_rels` table for the `icon` upload (relationship to `media`).
3. New `event_types_id` columns on `offers_rels`, `_offers_v_rels`, `payload_locked_documents_rels`, and `payload_preferences_rels`.

We hand-write the SQL per the [`eventizer-payload-migrations`](../../../.claude/skills/eventizer-payload-migrations/SKILL.md) skill rather than running `pnpm payload migrate:create` (which prompts on unrelated drift).

- [ ] **Step 1: Create the migration file**

```ts
// src/migrations/20260526_120000_add_event_types.ts
// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds the `event_types` collection table plus the relationship-link columns
 * that Payload's Postgres adapter requires for the new `eventTypes hasMany`
 * relationship on Offers (added in the same release).
 *
 * Tables affected:
 *   • event_types               — main rows
 *   • event_types_rels          — for the icon upload (relationship to media)
 *   • offers_rels               — gains event_types_id column for the live relation
 *   • _offers_v_rels            — gains event_types_id column for the versioned relation
 *   • payload_locked_documents_rels — needs the column for cross-collection lock indexing
 *   • payload_preferences_rels  — needs the column for admin UI preferences
 *
 * Every DDL is idempotent (IF NOT EXISTS) so re-running on a dev DB that
 * already has these via `payload db:push` is safe.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. Main table
    CREATE TABLE IF NOT EXISTS "event_types" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "icon_id" integer,
      "description" varchar,
      "is_active" boolean DEFAULT true NOT NULL,
      "_order" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "event_types_slug_idx"
      ON "event_types" USING btree ("slug");

    CREATE INDEX IF NOT EXISTS "event_types_icon_idx"
      ON "event_types" USING btree ("icon_id");

    -- 2. Relationship-link table for the icon upload
    CREATE TABLE IF NOT EXISTS "event_types_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );

    CREATE INDEX IF NOT EXISTS "event_types_rels_parent_idx"
      ON "event_types_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "event_types_rels_path_idx"
      ON "event_types_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "event_types_rels_media_id_idx"
      ON "event_types_rels" USING btree ("media_id");

    -- 3. FKs from event_types and event_types_rels
    DO $$ BEGIN
      ALTER TABLE "event_types"
        ADD CONSTRAINT "event_types_icon_id_media_id_fk"
        FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "event_types_rels"
        ADD CONSTRAINT "event_types_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."event_types"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "event_types_rels"
        ADD CONSTRAINT "event_types_rels_media_fk"
        FOREIGN KEY ("media_id") REFERENCES "public"."media"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 4. Add event_types_id link column to offers_rels (live) and _offers_v_rels (versioned)
    ALTER TABLE "offers_rels" ADD COLUMN IF NOT EXISTS "event_types_id" integer;
    ALTER TABLE "_offers_v_rels" ADD COLUMN IF NOT EXISTS "event_types_id" integer;

    CREATE INDEX IF NOT EXISTS "offers_rels_event_types_id_idx"
      ON "offers_rels" USING btree ("event_types_id");
    CREATE INDEX IF NOT EXISTS "_offers_v_rels_event_types_id_idx"
      ON "_offers_v_rels" USING btree ("event_types_id");

    DO $$ BEGIN
      ALTER TABLE "offers_rels"
        ADD CONSTRAINT "offers_rels_event_types_fk"
        FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_offers_v_rels"
        ADD CONSTRAINT "_offers_v_rels_event_types_fk"
        FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 5. payload_locked_documents_rels — Payload indexes every collection here
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "event_types_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_event_types_id_idx"
      ON "payload_locked_documents_rels" USING btree ("event_types_id");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_event_types_fk"
        FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 6. payload_preferences_rels — needed for admin UI preferences
    ALTER TABLE "payload_preferences_rels"
      ADD COLUMN IF NOT EXISTS "event_types_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_event_types_id_idx"
      ON "payload_preferences_rels" USING btree ("event_types_id");

    DO $$ BEGIN
      ALTER TABLE "payload_preferences_rels"
        ADD CONSTRAINT "payload_preferences_rels_event_types_fk"
        FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "event_types_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "event_types_id";
    ALTER TABLE "_offers_v_rels" DROP COLUMN IF EXISTS "event_types_id";
    ALTER TABLE "offers_rels" DROP COLUMN IF EXISTS "event_types_id";
    DROP TABLE IF EXISTS "event_types_rels";
    DROP TABLE IF EXISTS "event_types";
  `)
}
```

- [ ] **Step 2: Register the migration in `src/migrations/index.ts`**

Open `src/migrations/index.ts`. At the top (with the other imports), add:

```ts
import * as migration_20260526_120000_add_event_types from './20260526_120000_add_event_types'
```

In the array (at the end, after `20260523_190000_add_partners_upload_relationship_columns`), add a comma after the last existing entry and append:

```ts
  {
    up: migration_20260526_120000_add_event_types.up,
    down: migration_20260526_120000_add_event_types.down,
    name: '20260526_120000_add_event_types'
  },
```

- [ ] **Step 3: Add the migration to `ALWAYS_RUN`**

In `scripts/prepare-migrations.mjs`, find the `ALWAYS_RUN` set and add the new name. After this edit it should read:

```js
const ALWAYS_RUN = new Set([
  '20260512_135000_ensure_processed_stripe_events_schema',
  '20260523_180000_add_partners_block',
  '20260523_190000_add_partners_upload_relationship_columns',
  '20260526_120000_add_event_types',
])
```

- [ ] **Step 4: Apply locally**

```bash
pnpm payload migrate
```

Expected: completes successfully; final line includes `20260526_120000_add_event_types`. Re-running is a no-op (idempotent).

- [ ] **Step 5: Verify the schema**

```bash
psql "$POSTGRES_URL" -c "\\d event_types" -c "\\d event_types_rels" -c "SELECT column_name FROM information_schema.columns WHERE table_name='offers_rels' AND column_name='event_types_id';"
```

Expected: `event_types` table exists with the listed columns; `offers_rels` has an `event_types_id` column.

- [ ] **Step 6: Commit**

```bash
git add src/migrations/20260526_120000_add_event_types.ts src/migrations/index.ts scripts/prepare-migrations.mjs
git commit -m "feat(event-types): add schema migration for event_types table + offers relation columns"
```

---

## Task 3: Add seed migration with the 11 default event types

**Files:**
- Create: `src/migrations/20260526_120500_seed_event_types.ts`
- Modify: `src/migrations/index.ts`, `scripts/prepare-migrations.mjs`

- [ ] **Step 1: Create the seed migration**

```ts
// src/migrations/20260526_120500_seed_event_types.ts
// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Seeds the 11 default event types. Idempotent on slug: re-running won't
 * duplicate rows, and won't UPDATE existing rows (so admin edits to names
 * or icons aren't reverted by a redeploy).
 *
 * Icons are left null — admin uploads them via the panel after deploy; the
 * wizard and listing strip render a Sparkles lucide fallback meanwhile.
 */
const DEFAULTS = [
  { name: 'Wesele',                         slug: 'wesele',                         order: 100 },
  { name: 'Event firmowy',                  slug: 'event-firmowy',                  order: 200 },
  { name: 'Urodziny',                       slug: 'urodziny',                       order: 300 },
  { name: 'Impreza prywatna',               slug: 'impreza-prywatna',               order: 400 },
  { name: 'Wieczór kawalerski / panieński', slug: 'wieczor-kawalerski-panienski',   order: 500 },
  { name: 'Studniówka / bal',               slug: 'studniowka-bal',                 order: 600 },
  { name: 'Chrzciny / komunie',             slug: 'chrzciny-komunie',               order: 700 },
  { name: 'Konferencja / gala',             slug: 'konferencja-gala',               order: 800 },
  { name: 'Festiwal / event masowy',        slug: 'festiwal-event-masowy',          order: 900 },
  { name: 'Sesja foto / produkcja',         slug: 'sesja-foto-produkcja',           order: 1000 },
  { name: 'Inne',                           slug: 'inne',                           order: 1100 },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const t of DEFAULTS) {
    await db.execute(sql`
      INSERT INTO "event_types" ("name", "slug", "is_active", "_order", "updated_at", "created_at")
      VALUES (${t.name}, ${t.slug}, true, ${t.order}, now(), now())
      ON CONFLICT ("slug") DO NOTHING
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Only delete the seeded defaults — leave any admin-created types alone.
  for (const t of DEFAULTS) {
    await db.execute(sql`DELETE FROM "event_types" WHERE "slug" = ${t.slug}`)
  }
}
```

- [ ] **Step 2: Register in `src/migrations/index.ts`**

Add import at top:

```ts
import * as migration_20260526_120500_seed_event_types from './20260526_120500_seed_event_types'
```

Append entry to the array (after the previous task's entry):

```ts
  {
    up: migration_20260526_120500_seed_event_types.up,
    down: migration_20260526_120500_seed_event_types.down,
    name: '20260526_120500_seed_event_types'
  },
```

- [ ] **Step 3: Add to `ALWAYS_RUN`**

In `scripts/prepare-migrations.mjs` append to the set:

```js
const ALWAYS_RUN = new Set([
  '20260512_135000_ensure_processed_stripe_events_schema',
  '20260523_180000_add_partners_block',
  '20260523_190000_add_partners_upload_relationship_columns',
  '20260526_120000_add_event_types',
  '20260526_120500_seed_event_types',
])
```

- [ ] **Step 4: Apply locally**

```bash
pnpm payload migrate
```

Expected: succeeds. Verify with:

```bash
psql "$POSTGRES_URL" -c "SELECT slug, name, is_active FROM event_types ORDER BY _order;"
```

Expected: 11 rows in the specified order, all `is_active = true`.

- [ ] **Step 5: Re-run to confirm idempotency**

```bash
pnpm payload migrate
```

Expected: completes (the migration is in `ALWAYS_RUN` so it runs every time) without changing row count. Verify count again:

```bash
psql "$POSTGRES_URL" -c "SELECT COUNT(*) FROM event_types;"
```

Expected: `11`.

- [ ] **Step 6: Commit**

```bash
git add src/migrations/20260526_120500_seed_event_types.ts src/migrations/index.ts scripts/prepare-migrations.mjs
git commit -m "feat(event-types): seed 11 default event types (idempotent on slug)"
```

---

## Task 4: Add `eventTypes` relationship field to Offers

**Files:**
- Modify: `src/collections/Offers/fields.ts`, `src/collections/Offers/index.ts`

- [ ] **Step 1: Add the field to `offersFields`**

In `src/collections/Offers/fields.ts`, locate the `category` field block (around line 57). After the closing `},` of the `category` field, insert:

```ts
  {
    name: 'eventTypes',
    type: 'relationship',
    relationTo: 'event-types',
    hasMany: true,
    required: false,
    label: { en: 'Event Types', pl: 'Rodzaje eventów' },
    filterOptions: () => ({ isActive: { equals: true } }),
    admin: {
      description: {
        en: 'Which kinds of events this offer is suitable for. Leave empty to appear in every rodzaj filter.',
        pl: 'Dla jakich rodzajów eventów ta oferta jest odpowiednia. Pozostaw puste, aby oferta pojawiała się dla wszystkich rodzajów.',
      },
    },
  },
```

- [ ] **Step 2: Expand `defaultPopulate` in `src/collections/Offers/index.ts`**

Find the `defaultPopulate` block (around line 56). Add `eventTypes: true,` near the top, after `categorySlug: true,`:

```ts
  defaultPopulate: {
    title: true,
    _status: true,
    link: true,
    mainImage: true,
    categoryName: true,
    categorySlug: true,
    eventTypes: true,
    shortDescription: true,
    // ... rest unchanged
  },
```

- [ ] **Step 3: Regenerate types**

```bash
pnpm generate:types
```

Expected: succeeds; `Offer.eventTypes` is now typed as `(number | EventType)[] | null | undefined`.

- [ ] **Step 4: Verify in dev**

```bash
pnpm dev
```

Open `http://localhost:3000/app/collections/offers` and edit an existing offer. Expected:
- Below the Category field, a new "Rodzaje eventów" multi-select is visible.
- The picker only lists active event types (i.e. all 11 seeded).
- Save with two selected; reload — the selection persists.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Offers/fields.ts src/collections/Offers/index.ts src/payload-types.ts
git commit -m "feat(event-types): add eventTypes hasMany relationship to Offers"
```

---

## Task 5: Extend the wizard zod schema with `eventTypes`

**Files:**
- Modify: `src/components/panel/wizard/offerSchema.ts`

- [ ] **Step 1: Add `eventTypes` to `offerSchema`**

In `src/components/panel/wizard/offerSchema.ts`, find the `offerSchema` object (line 5). Add `eventTypes` after `category`:

```ts
export const offerSchema = z
  .object({
    title: z.string().min(1, 'Tytuł jest wymagany').max(150, 'Tytuł jest za długi'),
    link: z
      .string()
      .min(2, 'Link musi mieć co najmniej 2 znaki')
      .max(80, 'Link nie może przekraczać 80 znaków')
      .regex(SLUG_REGEX, 'Tylko małe litery, cyfry i myślniki (np. fotolustro-drewniane)'),
    category: z.string().min(1, 'Kategoria jest wymagana'),
    eventTypes: z.array(z.number()).optional().default([]),
    shortDescription: z.string().max(500, 'Maksymalnie 500 znaków').optional().default(''),
    // ... rest unchanged
```

- [ ] **Step 2: Add `eventTypes` to `stepSchemas[0]`**

Find the `stepSchemas` array (around line 81). In the first entry (step 1 — basic info), add the field:

```ts
export const stepSchemas = [
  // Step 1: Basic info
  z.object({
    title: z.string().min(1, 'Tytuł jest wymagany').max(150, 'Tytuł jest za długi'),
    category: z.string().min(1, 'Kategoria jest wymagana'),
    eventTypes: z.array(z.number()).optional().default([]),
    shortDescription: z.string().max(500, 'Maksymalnie 500 znaków').optional().default(''),
  }),
  // ... rest unchanged
```

- [ ] **Step 3: Sanity-check the type**

```bash
pnpm tsc --noEmit
```

Expected: no errors related to `OfferFormData` or `offerSchema`.

- [ ] **Step 4: Commit**

```bash
git add src/components/panel/wizard/offerSchema.ts
git commit -m "feat(event-types): add eventTypes field to offerSchema + step 1 schema"
```

---

## Task 6: Build the `EventTypePicker` component

**Files:**
- Create: `src/components/panel/wizard/EventTypePicker.tsx`

This is a controlled multi-select chip grid. It receives the full active-type list and the selected ID array, and emits the updated array. The visual idiom matches `CategoryPicker`'s card style.

- [ ] **Step 1: Create the component file**

```tsx
// src/components/panel/wizard/EventTypePicker.tsx
'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EventTypeItem {
  id: number
  name: string
  slug: string
  icon?: { url?: string | null } | number | null
}

interface EventTypePickerProps {
  eventTypes: EventTypeItem[]
  value: number[]
  onChange: (ids: number[]) => void
}

const snappySpring = { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.6 }

function EventTypeIcon({ icon }: { icon?: EventTypeItem['icon'] }) {
  const [failed, setFailed] = React.useState(false)
  if (!failed && typeof icon === 'object' && icon?.url) {
    return (
      <Image
        src={icon.url}
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0 rounded-sm object-contain dark:invert"
        onError={() => setFailed(true)}
      />
    )
  }
  return <Sparkles className="size-7 shrink-0 text-accent/60" />
}

export function EventTypePicker({ eventTypes, value, onChange }: EventTypePickerProps) {
  const shouldReduceMotion = useReducedMotion()
  const selectedSet = React.useMemo(() => new Set(value), [value])

  const toggle = (id: number) => {
    if (selectedSet.has(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  const selectAll = () => onChange(eventTypes.map((t) => t.id))
  const clearAll = () => onChange([])

  const selectedCount = value.length
  const totalCount = eventTypes.length

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {eventTypes.map((t) => {
          const isSelected = selectedSet.has(t.id)
          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              whileHover={shouldReduceMotion ? undefined : { y: -2, transition: snappySpring }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors',
                isSelected
                  ? 'border border-primary/40 bg-primary/5 text-foreground shadow-sm'
                  : 'bg-background border border-border/20 hover:border-accent/30 hover:bg-accent/5',
              )}
            >
              <EventTypeIcon icon={t.icon} />
              <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
              {isSelected && <Check className="size-4 shrink-0 text-primary" />}
            </motion.button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Wybrano {selectedCount} z {totalCount} rodzajów
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={selectedCount === totalCount}
          >
            Wybierz wszystkie
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={selectedCount === 0}
          >
            Odznacz wszystkie
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Sanity-check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/wizard/EventTypePicker.tsx
git commit -m "feat(event-types): add EventTypePicker wizard component (chip grid)"
```

---

## Task 7: Wire `EventTypePicker` into `StepBasicInfo` and `OfferWizardForm`

**Files:**
- Modify: `src/components/panel/wizard/steps/StepBasicInfo.tsx`
- Modify: `src/components/panel/wizard/OfferWizardForm.tsx`

- [ ] **Step 1: Extend `StepBasicInfo` to render the picker**

Replace the contents of `src/components/panel/wizard/steps/StepBasicInfo.tsx` with:

```tsx
'use client'

import { Controller, type Control, type FieldErrors, type UseFormWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { CategoryPicker } from '@/components/panel/wizard/CategoryPicker'
import { EventTypePicker, type EventTypeItem } from '@/components/panel/wizard/EventTypePicker'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface StepBasicInfoProps {
  control: Control<OfferFormData>
  errors: FieldErrors<OfferFormData>
  watch: UseFormWatch<OfferFormData>
  categories: any[]
  eventTypes: EventTypeItem[]
}

export function StepBasicInfo({ control, errors, categories, eventTypes }: StepBasicInfoProps) {
  return (
    <FieldGroup>
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="title">Tytuł oferty</FieldLabel>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <Input
                id="title"
                placeholder="np. DJ na wesele - profesjonalna oprawa muzyczna"
                {...field}
                aria-invalid={!!errors.title}
              />
              <div className="flex items-center justify-between">
                <FieldError>{errors.title?.message}</FieldError>
                <span className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/150
                </span>
              </div>
            </div>
          )}
        />
      </Field>

      <Field data-invalid={!!errors.category}>
        <FieldLabel>Kategoria</FieldLabel>
        <FieldDescription>
          Wybierz kategorię, która najlepiej opisuje Twoją ofertę
        </FieldDescription>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CategoryPicker
              categories={categories}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FieldError>{errors.category?.message}</FieldError>
      </Field>

      <Field>
        <FieldLabel>Rodzaje eventów</FieldLabel>
        <FieldDescription>
          Wybierz rodzaje eventów, na których świadczysz tę usługę. Pozostawienie wszystkich zaznaczonych = oferta pojawi się we wszystkich filtrach.
        </FieldDescription>
        <Controller
          name="eventTypes"
          control={control}
          render={({ field }) => (
            <EventTypePicker
              eventTypes={eventTypes}
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </Field>
    </FieldGroup>
  )
}
```

- [ ] **Step 2: Thread `eventTypes` through `OfferWizardForm` props**

Open `src/components/panel/wizard/OfferWizardForm.tsx`.

(a) In the `OfferWizardFormProps` interface (around line 94), add:

```ts
  eventTypes: EventTypeItem[]
```

(b) Add the import at the top (with the other step imports):

```ts
import type { EventTypeItem } from './EventTypePicker'
```

(c) Add `eventTypes` to the destructured props (around line 106):

```ts
export function OfferWizardForm({
  mode,
  initialData,
  offerId,
  categories,
  eventTypes,
  lang,
  backgroundImageUrl,
  breadcrumbs,
  userServiceCategory,
  userEmail,
}: OfferWizardFormProps) {
```

- [ ] **Step 3: Wire create-mode default and edit-mode hydration**

In the same file, find the `defaultValues` block in `useForm<OfferFormData>` (around line 173). After `category: initialData?.category ?? userServiceCategory ?? '',`, add:

```ts
      eventTypes:
        mode === 'edit'
          ? Array.isArray(initialData?.eventTypes)
            ? initialData.eventTypes.map((t: any) => (typeof t === 'object' ? t.id : t))
            : []
          : eventTypes.map((t) => t.id),
```

The above:
- For **edit** mode: read whatever Payload returned, normalize objects-or-IDs to IDs, default to `[]` if absent.
- For **create** mode: pre-select every active event type.

- [ ] **Step 4: Include `eventTypes` in the submit payload**

Find the `offerData` object inside `handleFormSubmit` (around line 319). After `category: formData.category,`, add:

```ts
        eventTypes: formData.eventTypes,
```

- [ ] **Step 5: Pass `eventTypes` to the rendered `StepBasicInfo`**

Find the `currentStep === 0 && (<StepBasicInfo ...`  block (around line 427). Update the JSX to pass `eventTypes`:

```tsx
        {currentStep === 0 && (
          <StepBasicInfo
            control={control}
            errors={errors}
            watch={watch}
            categories={categories}
            eventTypes={eventTypes}
          />
        )}
```

- [ ] **Step 6: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: type errors only on the two `panel/oferty/*/page.tsx` files for missing `eventTypes` prop — fixed in Task 8.

- [ ] **Step 7: Commit**

```bash
git add src/components/panel/wizard/steps/StepBasicInfo.tsx src/components/panel/wizard/OfferWizardForm.tsx
git commit -m "feat(event-types): wire EventTypePicker into wizard step 1 + form state"
```

---

## Task 8: Fetch active event types in both panel pages

**Files:**
- Modify: `src/app/(frontend)/[lang]/panel/oferty/nowa/page.tsx`
- Modify: `src/app/(frontend)/[lang]/panel/oferty/[slug]/edytuj/page.tsx`

- [ ] **Step 1: Update `nowa/page.tsx`**

In `src/app/(frontend)/[lang]/panel/oferty/nowa/page.tsx`, replace the `Promise.all` block (around line 38) with:

```ts
  const [categoriesResult, eventTypesResult, bgUrl] = await Promise.all([
    payload.find({
      collection: 'service-categories',
      depth: 2,
      sort: 'name',
      limit: 100,
    }),
    payload.find({
      collection: 'event-types',
      where: { isActive: { equals: true } },
      sort: '_order',
      depth: 1,
      limit: 0,
    }),
    getHeaderBackgroundUrl(),
  ])
```

And update the `<OfferWizardForm>` JSX to pass the new prop:

```tsx
    <OfferWizardForm
      mode="create"
      categories={categoriesResult.docs}
      eventTypes={eventTypesResult.docs as any}
      lang={lang}
      backgroundImageUrl={bgUrl}
      breadcrumbs={[
        { label: 'Oferty', href: '/panel/oferty' },
        { label: 'Nowa oferta' },
      ]}
      userServiceCategory={user.serviceCategory}
      userEmail={user.email}
    />
```

- [ ] **Step 2: Update `edytuj/page.tsx`**

In `src/app/(frontend)/[lang]/panel/oferty/[slug]/edytuj/page.tsx`, similarly update the `Promise.all` block (around line 47):

```ts
  const [categoriesResult, eventTypesResult, bgUrl] = await Promise.all([
    payload.find({
      collection: 'service-categories',
      depth: 2,
      sort: 'name',
      limit: 100,
    }),
    payload.find({
      collection: 'event-types',
      where: { isActive: { equals: true } },
      sort: '_order',
      depth: 1,
      limit: 0,
    }),
    getHeaderBackgroundUrl(),
  ])
```

And the JSX:

```tsx
    <OfferWizardForm
      mode="edit"
      initialData={offer}
      offerId={offer.id}
      categories={categoriesResult.docs}
      eventTypes={eventTypesResult.docs as any}
      lang={lang}
      backgroundImageUrl={bgUrl}
      breadcrumbs={[
        { label: 'Oferty', href: '/panel/oferty' },
        { label: offer.title, href: `/panel/oferty/${slug}` },
        { label: 'Edytuj' },
      ]}
      userEmail={user.email}
    />
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Manual smoke test — create flow**

```bash
pnpm dev
```

Sign in as a service-provider, navigate to `/pl/panel/oferty/nowa`. Expected:
- Step 1 ("Podstawowe") shows the title field, category picker, AND a Rodzaje eventów grid with all 11 chips selected (filled, copper border).
- Counter reads "Wybrano 11 z 11 rodzajów".
- Click "Odznacz wszystkie" — all chips clear, counter becomes "Wybrano 0 z 11".
- Click two chips — they fill back in; counter "2 z 11".
- Fill title + category and complete the wizard through publish.

After publish, in another tab open `/app/collections/offers`, edit the offer just created, and verify the two selected rodzaje show in the panel admin's eventTypes field. Stop dev.

- [ ] **Step 5: Manual smoke test — edit flow on pre-feature offer**

Find an offer in the DB whose `offers_rels` has no `event_types_id` rows (i.e. an offer created before this feature):

```bash
psql "$POSTGRES_URL" -c "SELECT id, title FROM offers WHERE id NOT IN (SELECT DISTINCT parent_id FROM offers_rels WHERE event_types_id IS NOT NULL) LIMIT 5;"
```

Pick one and visit `/pl/panel/oferty/<that-offer-link>/edytuj`. Expected:
- Step 1 shows the rodzaj grid with ALL chips unchecked (count "0 z 11"). This is the legacy-offer hydration path.
- Save without changes — no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/oferty/nowa/page.tsx src/app/\(frontend\)/\[lang\]/panel/oferty/\[slug\]/edytuj/page.tsx
git commit -m "feat(event-types): fetch active event types in wizard pages, prefetch + pass to form"
```

---

## Task 9: Verify the server actions persist `eventTypes`

**Files:**
- Read only: `src/actions/panel/offers.ts`

This task is purely verification — no code change is expected. `createOffer` and `updateOffer` both accept `Partial<Offer>` and spread it into the Payload call. Once `Offer.eventTypes` exists in `payload-types.ts` (Task 4), the field flows through unchanged.

- [ ] **Step 1: Confirm the field round-trips**

With dev running (`pnpm dev`):

1. Sign in, open `/pl/panel/oferty/nowa`.
2. In Chrome DevTools Network tab, filter on "offers".
3. Create a new offer with 3 selected rodzaje types and publish.
4. Find the POST request to the server action. In its formData or JSON, confirm `eventTypes: [<id1>, <id2>, <id3>]` is present in the payload.
5. Confirm the response succeeds and the offer is created.
6. In `psql`, verify the rows landed:

```bash
psql "$POSTGRES_URL" -c "SELECT o.id, o.title, array_agg(et.slug ORDER BY et.slug) AS types FROM offers o LEFT JOIN offers_rels r ON r.parent_id = o.id AND r.event_types_id IS NOT NULL LEFT JOIN event_types et ON et.id = r.event_types_id WHERE o.title = '<your offer title>' GROUP BY o.id, o.title;"
```

Expected: the three selected slugs appear in the `types` array.

- [ ] **Step 2: If there is a regression, debug**

If the relationship rows are not written:
- Check the Network tab for a 4xx/5xx response with a Payload validation error.
- Check that `eventTypes` is actually in the JSON payload — if missing, recheck Step 4 of Task 7 (the `offerData` block).
- Check that the form's defaultValues include `eventTypes` (Step 3 of Task 7).

If everything is correct, no code change is required. Proceed.

- [ ] **Step 3: No commit** (this task has no file changes)

---

## Task 10: Extend the listings types and URL-param plumbing for `rodzaj`

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/types.ts`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/parseParams.ts`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/page.tsx`

- [ ] **Step 1: Add `rodzaj` to `OfferSearchParams` and `ParsedSearchParams`**

In `src/app/(frontend)/[lang]/ogloszenia/ListView/types.ts`, add `rodzaj?: string` to both interfaces:

```ts
export interface OfferSearchParams {
  strona?: string
  kategoria?: string
  rodzaj?: string
  szukaj?: string
  sortuj?: SortOption
  lat?: string
  lng?: string
  odleglosc?: string
  minCena?: string
  maxCena?: string
}

export interface ParsedSearchParams {
  page: number
  limit: number
  kategoria?: string
  rodzaj?: string
  szukaj?: string
  sortuj: SortOption
  lat?: number
  lng?: number
  odleglosc?: number
  minCena?: number
  maxCena?: number
  seed?: number
}
```

- [ ] **Step 2: Pass through in `parseParams.ts`**

In `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/parseParams.ts`, add `rodzaj: params.rodzaj,` to the returned object (between `kategoria` and `szukaj`):

```ts
  return {
    page: Number(params.strona) || 1,
    limit: DEFAULT_LIMIT,
    kategoria: params.kategoria,
    rodzaj: params.rodzaj,
    szukaj: params.szukaj,
    sortuj,
    lat: hasValidLocation ? lat : undefined,
    lng: hasValidLocation ? lng : undefined,
    odleglosc: hasValidLocation
      ? (params.odleglosc ? Number(params.odleglosc) : DEFAULT_DISTANCE_KM)
      : undefined,
    minCena: params.minCena ? Number(params.minCena) : undefined,
    maxCena: params.maxCena ? Number(params.maxCena) : undefined,
    seed: sortuj === 'random' ? (seed ?? generateSeed()) : undefined,
  }
```

- [ ] **Step 3: Read and forward `rodzaj` in `page.tsx`**

In `src/app/(frontend)/[lang]/ogloszenia/page.tsx`:

(a) Add `rodzaj?: string` to the `searchParams` type:

```ts
  searchParams: Promise<{
    strona?: string
    kategoria?: string
    rodzaj?: string
    szukaj?: string
    sortuj?: SortOption
    lat?: string
    lng?: string
    odleglosc?: string
    minCena?: string
    maxCena?: string
  }>
```

(b) Destructure it and forward to `<ListView>`:

```ts
  const { strona, kategoria, rodzaj, szukaj, sortuj, lat, lng, odleglosc, minCena, maxCena } = await searchParams

  return (
    <>
      <HeroView payload={payload} />
      <ListView
        payload={payload}
        strona={strona}
        kategoria={kategoria}
        rodzaj={rodzaj}
        szukaj={szukaj}
        sortuj={sortuj}
        lat={lat}
        lng={lng}
        odleglosc={odleglosc}
        minCena={minCena ? Number(minCena) : undefined}
        maxCena={maxCena ? Number(maxCena) : undefined}
      />
    </>
  )
```

- [ ] **Step 4: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: one missing-property error on `<ListView>` for `rodzaj` — fixed in Task 12. Acceptable for now.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/ogloszenia/ListView/types.ts src/app/\(frontend\)/\[lang\]/ogloszenia/ListView/utils/parseParams.ts src/app/\(frontend\)/\[lang\]/ogloszenia/page.tsx
git commit -m "feat(event-types): plumb ?rodzaj URL param through types + parser + page"
```

---

## Task 11: Add the `rodzaj` filter to `buildBaseConditions` (TDD)

**Files:**
- Create: `tests/int/lib/eventTypeConditions.int.spec.ts`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/conditions.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/int/lib/eventTypeConditions.int.spec.ts
import { describe, it, expect } from 'vitest'
import { buildBaseConditions } from '@/app/(frontend)/[lang]/ogloszenia/ListView/utils/conditions'
import type { ParsedSearchParams } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'

const base: ParsedSearchParams = {
  page: 1,
  limit: 10,
  sortuj: 'random',
}

describe('buildBaseConditions — rodzaj filter', () => {
  it('omits the eventTypes block when rodzaj is undefined', () => {
    const conditions = buildBaseConditions(base)
    const json = JSON.stringify(conditions)
    expect(json).not.toContain('eventTypes')
  })

  it('emits an or-block with eventTypes.slug equals AND exists:false when rodzaj is set', () => {
    const conditions = buildBaseConditions({ ...base, rodzaj: 'wesele' })

    const rodzajBlock = conditions.find(
      (c) => JSON.stringify(c).includes('eventTypes'),
    )
    expect(rodzajBlock).toBeDefined()
    expect(rodzajBlock).toEqual({
      or: [
        { 'eventTypes.slug': { equals: 'wesele' } },
        { eventTypes: { exists: false } },
      ],
    })
  })

  it('keeps the kategoria block intact when both kategoria and rodzaj are set', () => {
    const conditions = buildBaseConditions({
      ...base,
      kategoria: 'muzyka-rozrywka/dj',
      rodzaj: 'wesele',
    })

    const kategoriaBlock = conditions.find(
      (c) => JSON.stringify(c).includes('categorySlug'),
    )
    expect(kategoriaBlock).toBeDefined()

    const rodzajBlock = conditions.find(
      (c) => JSON.stringify(c).includes('eventTypes'),
    )
    expect(rodzajBlock).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
pnpm vitest run tests/int/lib/eventTypeConditions.int.spec.ts
```

Expected: the second and third tests FAIL with "rodzajBlock is undefined".

- [ ] **Step 3: Implement the condition**

In `src/app/(frontend)/[lang]/ogloszenia/ListView/utils/conditions.ts`, find `buildBaseConditions` (line 8). After the `kategoria` block (which ends around line 18) and before the geo block, insert:

```ts
  if (params.rodzaj) {
    conditions.push({
      or: [
        { 'eventTypes.slug': { equals: params.rodzaj } },
        { eventTypes: { exists: false } },
      ],
    })
  }
```

The full updated function should read:

```ts
export function buildBaseConditions(params: ParsedSearchParams): Where[] {
  const conditions: Where[] = [{ _status: { equals: 'published' } }]

  if (params.kategoria) {
    conditions.push({
      or: [
        { categorySlug: { equals: params.kategoria } },
        { categorySlug: { like: `${params.kategoria}/%` } },
      ],
    })
  }

  if (params.rodzaj) {
    conditions.push({
      or: [
        { 'eventTypes.slug': { equals: params.rodzaj } },
        { eventTypes: { exists: false } },
      ],
    })
  }

  // Add geo bounding box filter for location-based search
  if (params.lat !== undefined && params.lng !== undefined && params.odleglosc !== undefined) {
    // ... unchanged
```

- [ ] **Step 4: Re-run the tests to confirm they pass**

```bash
pnpm vitest run tests/int/lib/eventTypeConditions.int.spec.ts
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/ogloszenia/ListView/utils/conditions.ts tests/int/lib/eventTypeConditions.int.spec.ts
git commit -m "feat(event-types): filter offers by ?rodzaj with empty-matches-all semantics"
```

---

## Task 12: Fetch event types in `ListView` and pass them to the client view

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/index.tsx`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/index.client.tsx`

- [ ] **Step 1: Update `ListView/index.tsx` props and fetch**

Replace the contents of `src/app/(frontend)/[lang]/ogloszenia/ListView/index.tsx` with:

```tsx
import ClientListView from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import type { BasePayload } from 'payload'
import type { OfferSearchParams } from './types'
import { parseSearchParams, queryOffers } from './utils'
import { cookies } from 'next/headers'

interface ListViewProps {
  payload: BasePayload
  strona?: string
  kategoria?: string
  rodzaj?: string
  szukaj?: string
  sortuj?: string
  lat?: string
  lng?: string
  odleglosc?: string
  minCena?: number
  maxCena?: number
}

export default async function ListView({ payload, ...searchParams }: ListViewProps) {
  const cookieStore = await cookies()
  const cookieSeed = cookieStore.get('random-seed')?.value
  const seed = cookieSeed ? Number(cookieSeed) : undefined

  const params = parseSearchParams(searchParams as OfferSearchParams, seed)

  // Query offers with all filters and sorting
  const { offers, pagination } = await queryOffers(payload, params)

  // Fetch categories and active event types in parallel
  const [categories, eventTypes] = await Promise.all([
    payload.find({
      collection: 'service-categories',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'event-types',
      where: { isActive: { equals: true } },
      sort: '_order',
      depth: 1,
      limit: 0,
      overrideAccess: true,
    }),
  ])

  return (
    <ClientListView
      offers={offers}
      categoryData={categories.docs}
      eventTypes={eventTypes.docs}
      currentRodzaj={params.rodzaj}
      pagination={pagination}
      currentSort={params.sortuj}
      currentLat={params.lat}
      currentLng={params.lng}
      currentDistance={params.odleglosc}
      minCena={params.minCena}
      maxCena={params.maxCena}
      seed={params.seed}
    />
  )
}
```

- [ ] **Step 2: Accept and forward in `ListView/index.client.tsx`**

Open `src/app/(frontend)/[lang]/ogloszenia/ListView/index.client.tsx`. Update the imports and props:

```tsx
'use client'

import { useEffect } from 'react'
import { Offer, ServiceCategory, EventType } from '@/payload-types'
import OffersView from '@/app/(frontend)/[lang]/ogloszenia/ListView/OffersView'
import { usePathname } from 'next/navigation'
import SearchBar from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar'
import CategorySelection from '@/app/(frontend)/[lang]/ogloszenia/ListView/CategorySelection'
import EventTypeStrip from '@/app/(frontend)/[lang]/ogloszenia/ListView/EventTypeStrip'
import { SortOption } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'
import { ListViewTransitionProvider } from '@/app/(frontend)/[lang]/ogloszenia/ListView/TransitionContext'
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider'

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage?: number
  prevPage?: number
  minCena?: number
  maxCena?: number
}

interface ClientListViewProps {
  offers: Offer[] | null
  categoryData?: ServiceCategory[]
  eventTypes: EventType[]
  currentRodzaj?: string
  pagination: PaginationInfo
  currentSort: SortOption
  currentLat?: number
  currentLng?: number
  currentDistance?: number
  minCena?: number
  maxCena?: number
  seed?: number
}

export default function ClientListView({
  offers,
  categoryData,
  eventTypes,
  currentRodzaj,
  pagination,
  currentSort,
  currentLat,
  currentLng,
  currentDistance,
  minCena,
  maxCena,
  seed,
}: ClientListViewProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (seed !== undefined) {
      document.cookie = `random-seed=${seed}; path=/; SameSite=Lax`
    }
  }, [seed])

  return (
    <GoogleMapsProvider>
    <ListViewTransitionProvider>
    <div
      className="flex flex-col md:flex-row w-full -mt-8 pt-8 gap-8 md:h-screen md:max-h-screen "
      id="oferty"
    >
      <CategorySelection categoryData={categoryData} />

      <div className="w-full max-w-575 h-full min-w-0 py-0 flex flex-col gap-4">
        <div id="offers-search-anchor">
          <SearchBar
            currentSort={currentSort}
            currentLat={currentLat}
            currentLng={currentLng}
            currentDistance={currentDistance}
            minPrice={minCena}
            maxPrice={maxCena}
            eventTypes={eventTypes}
            currentRodzaj={currentRodzaj}
          />
        </div>

        <EventTypeStrip eventTypes={eventTypes} currentRodzaj={currentRodzaj} />

        <OffersView offers={offers} pagination={pagination} pathname={pathname} />
      </div>
    </div>
    </ListViewTransitionProvider>
    </GoogleMapsProvider>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: errors only on `EventTypeStrip` (missing — built in Task 13) and `SearchBar` (missing props — fixed in Task 14). Acceptable.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/ogloszenia/ListView/index.tsx src/app/\(frontend\)/\[lang\]/ogloszenia/ListView/index.client.tsx
git commit -m "feat(event-types): fetch active event types in ListView, thread to client view"
```

---

## Task 13: Build the `EventTypeStrip` component

**Files:**
- Create: `src/app/(frontend)/[lang]/ogloszenia/ListView/EventTypeStrip/index.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(frontend)/[lang]/ogloszenia/ListView/EventTypeStrip/index.tsx
'use client'

import * as React from 'react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useListViewTransition } from '@/app/(frontend)/[lang]/ogloszenia/ListView/TransitionContext'
import type { EventType } from '@/payload-types'

interface EventTypeStripProps {
  eventTypes: EventType[]
  currentRodzaj?: string
}

const snappySpring = { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.6 }

function StripIcon({ icon }: { icon: EventType['icon'] }) {
  const [failed, setFailed] = React.useState(false)
  if (!failed && typeof icon === 'object' && icon && 'url' in icon && icon.url) {
    return (
      <Image
        src={icon.url}
        alt=""
        width={20}
        height={20}
        className="size-5 shrink-0 rounded-sm object-contain dark:invert"
        onError={() => setFailed(true)}
      />
    )
  }
  return <Sparkles className="size-5 shrink-0 text-accent/70" />
}

export default function EventTypeStrip({ eventTypes, currentRodzaj }: EventTypeStripProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startTransition } = useListViewTransition()
  const shouldReduceMotion = useReducedMotion()

  const setRodzaj = React.useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (slug) params.set('rodzaj', slug)
      else params.delete('rodzaj')
      params.delete('strona')

      const qs = params.toString()
      startTransition(() => {
        router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
      })
    },
    [router, pathname, searchParams, startTransition],
  )

  if (!eventTypes.length) return null

  const chip = (opts: {
    key: string
    active: boolean
    onClick: () => void
    icon?: React.ReactNode
    label: string
  }) => (
    <motion.button
      key={opts.key}
      type="button"
      onClick={opts.onClick}
      whileHover={shouldReduceMotion ? undefined : { y: -2, transition: snappySpring }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
      aria-pressed={opts.active}
      className={cn(
        'flex shrink-0 snap-start items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        opts.active
          ? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
          : 'border-border/30 bg-background/60 text-muted-foreground hover:border-accent/40 hover:bg-accent/5 hover:text-foreground',
      )}
    >
      {opts.icon}
      <span>{opts.label}</span>
    </motion.button>
  )

  return (
    <div
      className="relative -mx-2 px-2 lg:mx-0 lg:px-0"
      role="region"
      aria-label="Filtruj po rodzaju eventu"
    >
      <div
        className={cn(
          'flex gap-2 overflow-x-auto snap-x snap-mandatory py-1',
          'lg:flex-wrap lg:overflow-visible',
          '[mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)] lg:[mask-image:none]',
        )}
      >
        {chip({
          key: 'all',
          active: !currentRodzaj,
          onClick: () => setRodzaj(null),
          label: 'Wszystkie',
        })}
        {eventTypes.map((t) =>
          chip({
            key: String(t.id),
            active: currentRodzaj === t.slug,
            onClick: () => setRodzaj(t.slug),
            icon: <StripIcon icon={t.icon} />,
            label: t.name,
          }),
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: errors remain only on `SearchBar` (Task 14).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/ogloszenia/ListView/EventTypeStrip/index.tsx
git commit -m "feat(event-types): add EventTypeStrip chip filter on /ogloszenia"
```

---

## Task 14: Update `SearchBar` and `ActiveFilters` to render the rodzaj badge

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/index.tsx`
- Modify: `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/ActiveFilters/index.tsx`

- [ ] **Step 1: Update `SearchBar/index.tsx` to accept and forward props**

Replace the contents of `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/index.tsx` with:

```tsx
'use client'

import Search from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Search'
import PriceRangeInputs from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Settings/PriceRange'
import LocationSearch from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Settings/LocationSearch'
import SortSelect from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Settings/SortSelect'
import ActiveFilters from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/ActiveFilters'
import { SortOption } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Settings2Icon } from 'lucide-react'
import type { EventType } from '@/payload-types'

export default function SearchBar({
  currentSort,
  currentLat,
  currentLng,
  currentDistance,
  minPrice,
  maxPrice,
  eventTypes,
  currentRodzaj,
}: {
  currentSort: SortOption
  currentLat?: number
  currentLng?: number
  currentDistance?: number
  minPrice?: number
  maxPrice?: number
  eventTypes: EventType[]
  currentRodzaj?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex w-full gap-2 sm:gap-6 h-16 min-h-16">
        <Search />

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-full px-6 py-4 items-center dark:bg-black/60 border rounded-2xl hover:bg-muted dark:hover:bg-black/80 transition-colors cursor-pointer">
              <Settings2Icon size={22} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-4 bg-background/50 backdrop-blur-md rounded-2xl"
            align="end"
          >
            <div className="flex flex-col gap-4">
              <h4 className="xl:text-4xl w-fit md:text-3xl sm:text-2xl text-xl font-bebas max-w-7xl text-foreground ">
                Ustawienia
              </h4>
              <SortSelect currentSort={currentSort} />
              <LocationSearch
                currentLat={currentLat}
                currentLng={currentLng}
                currentDistance={currentDistance}
              />
              <PriceRangeInputs minPrice={minPrice} maxPrice={maxPrice} />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <ActiveFilters
        currentSort={currentSort}
        currentLat={currentLat}
        currentLng={currentLng}
        currentDistance={currentDistance}
        minPrice={minPrice}
        maxPrice={maxPrice}
        eventTypes={eventTypes}
        currentRodzaj={currentRodzaj}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update `ActiveFilters/index.tsx` to render the rodzaj badge**

In `src/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/ActiveFilters/index.tsx`:

(a) Update the imports — add `Sparkles` lucide and `EventType` type:

```tsx
import { MapPin, ArrowUpDown, DollarSign, Search, Tag, Sparkles, X } from 'lucide-react'
// ... other imports unchanged
import type { EventType } from '@/payload-types'
```

(b) Extend `ActiveFiltersProps`:

```tsx
interface ActiveFiltersProps {
  currentSort: SortOption
  currentLat?: number
  currentLng?: number
  currentDistance?: number
  minPrice?: number
  maxPrice?: number
  eventTypes: EventType[]
  currentRodzaj?: string
}
```

(c) Destructure the new props in the function signature:

```tsx
export default function ActiveFilters({
  currentSort,
  currentLat,
  currentLng,
  currentDistance,
  minPrice,
  maxPrice,
  eventTypes,
  currentRodzaj,
}: ActiveFiltersProps) {
```

(d) Compute the rodzaj presence and label. Locate the existing `currentCategory` line (around line 37) and add below it:

```tsx
  const matchedRodzaj = currentRodzaj
    ? eventTypes.find((t) => t.slug === currentRodzaj)
    : undefined
  const hasRodzaj = !!matchedRodzaj
```

(e) Add `hasRodzaj` to the `hasAnyFilter` calculation:

```tsx
  const hasAnyFilter = hasLocation || hasPriceMin || hasPriceMax || hasSearch || hasCategory || hasRodzaj || hasNonDefaultSort
```

(f) Render the badge. Inside the returned `<div className="flex flex-wrap gap-2">`, right after the `hasCategory` block (around line 96), add:

```tsx
      {hasRodzaj && (
        <FilterBadge
          icon={<Sparkles className="size-3" />}
          label={matchedRodzaj!.name}
          onRemove={() => removeParam('rodzaj')}
        />
      )}
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: clean across the project.

- [ ] **Step 4: Manual smoke test**

```bash
pnpm dev
```

Visit `/pl/ogloszenia`. Expected:
- Below the search bar, the strip shows "Wszystkie" + the 11 type chips. "Wszystkie" is highlighted.
- Click "Wesele" — URL becomes `/pl/ogloszenia?rodzaj=wesele`, the "Wesele" chip highlights, and an "Wesele" badge appears in the active-filters row.
- Click the X on the badge — URL clears `rodzaj`, "Wszystkie" highlights again.
- Combine with `?kategoria=...`: pick a category in the sidebar first, then a rodzaj — both filters are active, both badges visible.

Verify the result set narrows correctly: an offer with no event types should still appear under every `?rodzaj=` filter (legacy fallback).

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/ogloszenia/ListView/SearchBar/index.tsx src/app/\(frontend\)/\[lang\]/ogloszenia/ListView/SearchBar/ActiveFilters/index.tsx
git commit -m "feat(event-types): show rodzaj filter badge in ActiveFilters, wire SearchBar props"
```

---

## Task 15: Full manual verification pass

**Files:** none (verification only)

Work through the spec's §9 checklist end-to-end against a fresh dev server. Fix any regression inline and add a follow-up commit per fix.

- [ ] **Step 1: Start dev**

```bash
pnpm dev
```

- [ ] **Step 2: Create-flow check**

1. Sign in as a service-provider.
2. `/pl/panel/oferty/nowa` — confirm 11 chips pre-selected; "Wybrano 11 z 11".
3. Deselect 2 chips; publish.
4. In `psql`:

```bash
psql "$POSTGRES_URL" -c "SELECT o.title, array_agg(et.slug ORDER BY et.slug) FROM offers o LEFT JOIN offers_rels r ON r.parent_id = o.id AND r.event_types_id IS NOT NULL LEFT JOIN event_types et ON et.id = r.event_types_id WHERE o.title = '<your title>' GROUP BY o.id, o.title;"
```

Expected: exactly the 9 still-selected slugs.

- [ ] **Step 3: Legacy-offer check**

Edit a pre-feature offer (one with no `event_types_id` rows). Confirm:
- Step 1 shows 0/11 selected.
- Open `/pl/ogloszenia?rodzaj=wesele`. The offer appears (legacy = always visible).
- Open `/pl/ogloszenia?rodzaj=urodziny`. Still appears.

- [ ] **Step 4: Active-tag filter check**

Pick a newly-created offer that DOES have event types, but NOT `wesele`. Open `/pl/ogloszenia?rodzaj=wesele`. Confirm:
- The offer does NOT appear (it has event types, but `wesele` is not among them).
- The previously-checked legacy offer still appears.

- [ ] **Step 5: Combined filters**

`/pl/ogloszenia?kategoria=muzyka-rozrywka/dj&rodzaj=wesele`. Confirm only offers matching BOTH criteria appear.

- [ ] **Step 6: Inactive type hiding**

In the admin panel, edit "Inne" and uncheck `isActive`. Save. Reload:
- `/pl/ogloszenia` strip — "Inne" chip gone.
- `/pl/panel/oferty/nowa` step 1 — "Inne" not in the picker.

Re-activate before continuing.

- [ ] **Step 7: Slug-rename propagation**

In admin, rename `inne`'s slug to `inne-okazje`. Save. In a tab tagged with the "Inne" event type, reload `/pl/ogloszenia?rodzaj=inne-okazje`. Confirm the tagged offers immediately appear under the new slug (no resave needed).

Rename back to `inne` before continuing.

- [ ] **Step 8: Reduced-motion**

In OS settings, enable Reduce Motion. Reload `/pl/ogloszenia`. Hover a chip — no `y: -2` transform. Hover a wizard chip in `/pl/panel/oferty/nowa` step 1 — same.

- [ ] **Step 9: Mobile responsive**

In Chrome DevTools, switch to iPhone viewport. `/pl/ogloszenia` — strip scrolls horizontally with snap; edge fade masks visible. Wizard chips wrap to single column on small viewport.

- [ ] **Step 10: Stop dev and commit checklist outcome**

If nothing required a fix, no commit. If there were fixes, each should already be its own commit.

```bash
# Stop dev server
```

---

## Self-Review

After writing the plan, the following gaps were checked and resolved:

1. **Spec coverage** —
   - §3 (collection definition) → Task 1 ✓
   - §3.1 (seed defaults) → Task 3 ✓
   - §4 (Offers field + defaultPopulate) → Task 4 ✓
   - §4.1/§4.2 (no denorm, no hook) → no task needed (explicit non-implementation) ✓
   - §5.1 (EventTypePicker component) → Task 6 ✓
   - §5.2 (RHF wiring + hydration) → Task 7 ✓
   - §5.3 (server-side fetch) → Task 8 ✓
   - §5.4 (server actions) → Task 9 (verification only) ✓
   - §6.1 (URL param) → Task 10 ✓
   - §6.2 (EventTypeStrip) → Task 13 ✓
   - §6.3 (server fetch in ListView) → Task 12 ✓
   - §6.4 (query) → Task 11 ✓
   - §6.5 (ActiveFilters badge) → Task 14 ✓
   - §8 (build risk, ALWAYS_RUN) → addressed in Tasks 2 & 3 ✓
   - §9 (manual test checklist) → Task 15 ✓

2. **Placeholder scan** — no "TBD", "TODO", "appropriate", "similar to" instances. All code blocks are complete.

3. **Type consistency** —
   - `EventTypeItem` (Tasks 6, 7) and `EventType` (Tasks 12, 13, 14) consistently used (the picker uses its own minimal shape to decouple from the full Payload type; pages pass the full payload doc which is structurally compatible).
   - `eventTypes` prop is `EventTypeItem[]` in the wizard tree and `EventType[]` in the listing tree — both fine.
   - `currentRodzaj` always `string | undefined`.
   - Migration name `20260526_120000_add_event_types` matches between the file name, the index re-export, and the `ALWAYS_RUN` entry.
   - Seed name `20260526_120500_seed_event_types` likewise.

4. **Ambiguity** —
   - The empty-array hydration on edit (Task 7 Step 3) is spelled out: `Array.isArray && map(IDs)`, else `[]`. No interpretation needed.
   - The relationship column on `offers_rels` is `event_types_id` (Drizzle's snake_case for `eventTypes`); migration Step 4 (Task 2) matches.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-26-event-types.md`.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for catching regressions early on a 15-task plan that touches the wizard + listings + DB.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints. Faster turnaround if you want to babysit and answer questions live.

Which approach?
