#!/usr/bin/env node
/**
 * Pre-build cleanup: remove `payload_migrations` rows with `batch = -1`.
 *
 * Why: Payload's drizzle migrate command (`@payloadcms/drizzle/dist/migrate.js`)
 * detects rows with `batch = -1` (artifacts of someone running `payload db:push`
 * in dev mode against the production DB) and shows an interactive prompt:
 *
 *   "If you'd like to run migrations, data loss will occur. Would you like
 *    to proceed?"
 *
 * In non-TTY environments like Vercel build, `prompts()` cancels immediately
 * and the migrate process exits with code 0 — silently SKIPPING ALL migrations.
 * Plain `payload migrate` has no CLI flag to bypass this; `--force-accept-warning`
 * only applies to `migrate:create` / `migrate:fresh`.
 *
 * This script connects directly to Postgres, removes the offending rows
 * (which represent dev-mode pushes that are now superseded by proper
 * migration files), and exits cleanly. After it runs, `payload migrate`
 * sees a clean migration history and applies all pending migrations.
 *
 * Safe to run multiple times — `DELETE … WHERE batch = -1` is idempotent.
 * Safe on fresh DBs — bails silently if the table doesn't exist yet.
 */

import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URI

if (!connectionString) {
  console.warn('[prepare-migrations] POSTGRES_URL not set — skipping cleanup')
  process.exit(0)
}

const pool = new Pool({ connectionString })

try {
  // Check the table exists before attempting the delete.
  const tableExists = await pool.query(
    `SELECT to_regclass('public.payload_migrations') AS reg`,
  )
  if (!tableExists.rows[0]?.reg) {
    console.log('[prepare-migrations] payload_migrations table not yet created — nothing to clean')
    process.exit(0)
  }

  const result = await pool.query(
    `DELETE FROM payload_migrations WHERE batch = -1 RETURNING name`,
  )
  if (result.rowCount > 0) {
    console.log(
      `[prepare-migrations] Removed ${result.rowCount} dev-push migration row(s): ${result.rows
        .map((r) => r.name)
        .join(', ')}`,
    )
  } else {
    console.log('[prepare-migrations] No dev-push migrations to clean (batch=-1 rows: 0)')
  }
} catch (err) {
  console.error('[prepare-migrations] Failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
