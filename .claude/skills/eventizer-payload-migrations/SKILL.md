---
name: eventizer-payload-migrations
description: Use when Payload collection fields change in src/collections/**, or when diagnosing a Vercel build that fails with "column does not exist" / Drizzle SQL errors / missing-schema errors on /pl or any SSG page that queries offers.
---

> **Canonical map:** [`eventizer-mind/map/zones/offers-data.md`](../../../eventizer-mind/map/zones/offers-data.md) + decision [`migrate-before-next-build`](../../../eventizer-mind/map/decisions/migrate-before-next-build.md). This skill is the *procedural projection*.

# Payload Migrations in Eventizer

## The split: dev push vs prod migrate

- **Dev**: Payload's Vercel Postgres adapter auto-pushes schema from the TypeScript config on server init. Adding a field to a collection in dev just works — no migration file needed.
- **Prod (Vercel build)**: Next.js SSG prerenders pages *before* Payload initializes, so if the DB schema is behind the TS config, Drizzle's generated SELECT hits a missing column and the build fails (commonly on `/pl` which lists published offers).

The [package.json](../../../package.json) `build` script therefore prefixes `payload migrate` before `next build` so prod migrations apply ahead of prerender.

## Adding a new field → write a migration

1. Edit the collection in `src/collections/**`. Run `pnpm generate:types` to refresh [payload-types.ts](../../../src/payload-types.ts).
2. Write a **targeted, idempotent** migration file in [src/migrations/](../../../src/migrations/) — hand-written ALTERs are preferred over `pnpm payload migrate:create` because the interactive prompt will ask about unrelated drift in the existing DB that's risky to bless.
3. Register in [src/migrations/index.ts](../../../src/migrations/index.ts).

### Skeleton

```ts
// src/migrations/YYYYMMDD_HHMMSS_short_desc.ts
// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "new_column" varchar;
    ALTER TABLE "_offers_v" ADD COLUMN IF NOT EXISTS "version_new_column" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "offers" DROP COLUMN IF EXISTS "new_column";
    ALTER TABLE "_offers_v" DROP COLUMN IF EXISTS "version_new_column";
  `)
}
```

### Key rules

- **`IF NOT EXISTS` / `IF EXISTS`** always — migrations must be idempotent because dev DBs may already have the column from push.
- **Both tables**: `offers` for the live record, `_offers_v` for the versioned/draft table. Payload uses `version_<field>` prefix on versioned columns. Without the `_v` entry, draft writes break silently.
- **Group fields** serialize as `<group>_<field>` in SQL (e.g. `socialMedia.website` → `social_media_website`, and `version_social_media_website` on `_offers_v`).
- **Never commit unprompted `migrate:create` output** — the codebase has drift (e.g. prior `push`-only columns never captured), and answering its "rename vs create" questions blindly can destroy data.

## Verification

Before pushing:

```sh
pnpm generate:types   # confirms the new field compiles
pnpm payload migrate  # applies to your local DB — must succeed
```

Search for all references of the new column in SQL/migrations to be sure the versioned table wasn't missed:

```sh
grep -n "new_column\|version_new_column" src/migrations/*.ts
```

## When prod is already broken

If prod deploy is already failing with "column X does not exist":

1. Write the targeted migration as above (don't try to reconcile all drift).
2. Confirm [package.json](../../../package.json) still has `payload migrate &&` prefix on `build`.
3. Commit + push — Vercel will rerun build, migrate will apply, prerender will succeed.
