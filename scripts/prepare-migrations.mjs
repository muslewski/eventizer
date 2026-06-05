#!/usr/bin/env node
/**
 * Pre-build payload_migrations table reconciliation.
 *
 * Context: this project was bootstrapped via `payload db:push` (dev mode) which
 * pushes schema directly without writing migration files. Those dev-push events
 * leave rows in `payload_migrations` with `batch = -1`. When `payload migrate`
 * sees any such row, it prompts:
 *
 *   "If you'd like to run migrations, data loss will occur. Would you like to
 *    proceed?"
 *
 * In a non-TTY environment (Vercel build), `prompts()` cancels immediately and
 * the command exits with code 0 — silently SKIPPING ALL migrations. Plain
 * `payload migrate` has no flag to bypass this; `--force-accept-warning` only
 * applies to `migrate:create` / `migrate:fresh`.
 *
 * Strategy:
 *   1. Bail silently on fresh DBs (no payload_migrations table yet).
 *   2. Detect whether the schema is already present (we use the `users` table
 *      as a proxy — created by the very first migration, present if anything's
 *      ever been pushed).
 *   3. If schema present: for every migration file in src/migrations/, insert
 *      a row marking it as "already applied" (batch = 1) UNLESS its name is in
 *      ALWAYS_RUN. This includes both:
 *        - Re-inserting batch=-1 rows that an earlier deploy DELETEd
 *        - Adding rows for any never-tracked migration
 *   4. ALWAYS_RUN names: migrations we explicitly want Payload to execute. The
 *      defensive ProcessedStripeEvents schema migration is idempotent and
 *      restores the missing table + column.
 *
 * After this script runs, `payload_migrations` looks complete to the runner,
 * the dev-push prompt no longer fires, and only ALWAYS_RUN migrations actually
 * execute.
 */

import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'

const { Pool } = pg

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URI

if (!connectionString) {
  console.warn('[prepare-migrations] POSTGRES_URL not set — skipping')
  process.exit(0)
}

/**
 * Migrations we want `payload migrate` to actually execute (NOT pre-marked as
 * applied). All other migrations are assumed applied via earlier dev-push or
 * prior successful migrate runs. Migrations listed here MUST be idempotent
 * (CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, DO $$ EXCEPTION blocks).
 */
const ALWAYS_RUN = new Set([
  '20260512_135000_ensure_processed_stripe_events_schema',
  '20260523_180000_add_partners_block',
  '20260523_190000_add_partners_upload_relationship_columns',
  '20260526_120000_add_event_types',
  '20260526_120500_seed_event_types',
  '20260526_121000_fix_event_types_order_type',
  '20260603_120000_add_partners_collection_and_v2_block',
  '20260603_120500_seed_partners',
  '20260605_120000_add_partner_show_on_sign_in',
  '20260605_130000_partner_accent_hex',
  '20260605_140000_partners_v1_to_v2_home_onas',
])

const pool = new Pool({ connectionString })

try {
  // Step 1: bail silently if payload_migrations table doesn't exist yet.
  const tableCheck = await pool.query(
    `SELECT to_regclass('public.payload_migrations') AS reg`,
  )
  if (!tableCheck.rows[0]?.reg) {
    console.log(
      '[prepare-migrations] payload_migrations table not yet created — letting Payload bootstrap from scratch.',
    )
    process.exit(0)
  }

  // Step 2: schema-presence probe (users table).
  const usersCheck = await pool.query(`SELECT to_regclass('public.users') AS reg`)
  const schemaPresent = !!usersCheck.rows[0]?.reg

  if (!schemaPresent) {
    console.log(
      '[prepare-migrations] No users table — schema looks empty, letting all migrations run normally.',
    )
    process.exit(0)
  }

  // Step 3: remove any lingering batch = -1 rows (dev-push artifacts that
  // trigger the interactive prompt and silently abort the migrate command).
  const cleanup = await pool.query(
    `DELETE FROM payload_migrations WHERE batch = -1 RETURNING name`,
  )
  if (cleanup.rowCount > 0) {
    console.log(
      `[prepare-migrations] Removed ${cleanup.rowCount} batch=-1 row(s): ${cleanup.rows.map((r) => r.name).join(', ')}`,
    )
  }

  // Step 4: enumerate migration files and mark each as applied unless listed in ALWAYS_RUN.
  const migrationsDir = path.resolve(process.cwd(), 'src/migrations')
  const migrationNames = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d{8}_.*\.ts$/.test(f))
    .filter((f) => f !== 'index.ts')
    .map((f) => f.replace(/\.ts$/, ''))
    .sort()

  for (const name of migrationNames) {
    if (ALWAYS_RUN.has(name)) {
      console.log(`[prepare-migrations] Leaving "${name}" pending — Payload will run it`)
      continue
    }
    const insert = await pool.query(
      `INSERT INTO payload_migrations (name, batch, updated_at, created_at)
       SELECT $1::text, 1, now(), now()
       WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = $1::text)
       RETURNING name`,
      [name],
    )
    if (insert.rowCount > 0) {
      console.log(`[prepare-migrations] Marked "${name}" as already applied`)
    }
  }
} catch (err) {
  console.error('[prepare-migrations] Failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
