// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds `max_offers` to subscription_plans (per-plan offer cap, optional)
 * and `downgraded_drafted_at` to users (timestamp triggering the dashboard
 * downgrade-drafted banner). Neither table is versioned, so a single ALTER
 * each is enough.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "max_offers" numeric;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "downgraded_drafted_at" timestamp(3);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "max_offers";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "downgraded_drafted_at";
  `)
}
