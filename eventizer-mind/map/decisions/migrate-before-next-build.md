---
type: decision
summary: "The build script prefixes `payload migrate` before `next build` so prod DB schema is up-to-date before SSG prerender hits the database."
tags: [payload, migrations, build]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[offers-data]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
decided: 2026-06-02
supersededBy: ""
---

# Run `payload migrate` before `next build`

## Context
Next.js SSG prerenders pages *before* Payload initializes. When the DB schema is behind the
TypeScript collection config, Drizzle's generated SELECT hits a missing column and the build
fails — this most commonly surfaces on `/pl`, which lists published offers. Dev is unaffected
because the Vercel-Postgres adapter auto-pushes the schema from the TypeScript config on server
init; no migration file is needed in development. Prod Vercel builds do not auto-push, so the
gap between TS config and live schema must be closed explicitly before prerender runs.

## Decision
The `package.json` `build` script is `payload migrate && next build`. The migration step runs
first, bringing the production DB schema to the state the current TS config expects, so that
when `next build` prerenders pages the columns are already present.

## Why
Prerender must see an up-to-date schema; there is no safe ordering where the build can succeed
without the schema being aligned first. Dev push and prod migrate are fundamentally different
worlds — relying on push in prod would either destroy data or fail unpredictably. The explicit
`payload migrate` prefix is the only mechanism that guarantees the right schema before SSG.

## Consequences
Every Offers field change requires a hand-written idempotent migration touching **both**
`offers` and `_offers_v` (using `version_<field>` column names), guarded with
`IF [NOT] EXISTS`. Hand-written migrations are preferred over `pnpm payload migrate:create`
because the interactive prompt would bless unrelated drift. Migrations must be registered in
`src/migrations/index.ts`. If prod is already broken with "column X does not exist", write the
targeted migration and confirm the `payload migrate &&` prefix is still present in `build`.
