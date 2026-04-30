// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Drops NOT NULL on `subscription_plans.slug`, `subscription_plans.level`,
 * and the orphaned `subscription_plans.price` column. The Stripe plugin
 * auto-creates rows from `product.created` events with only `name` and
 * `description` populated; the previous NOT NULL constraints made every
 * auto-create fail with a Postgres error before admin could fill in the
 * other fields. After this migration, admin sets `slug`, `level`, and
 * `maxOffers` via the Payload admin UI as part of the post-merge runbook.
 *
 * The `price` column is unused by the application (the Payload field has
 * been commented out — pricing lives in Stripe) but the column was never
 * dropped from the DB. Relaxing NOT NULL on it lets new rows be inserted
 * with NULL price; a follow-up migration could drop the column entirely
 * if/when its absence is verified across all consumers.
 *
 * The UNIQUE index on slug is preserved — Postgres treats multiple NULLs
 * as not-equal, so multiple newly-synced plans without a slug can coexist.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscription_plans" ALTER COLUMN "slug" DROP NOT NULL;
    ALTER TABLE "subscription_plans" ALTER COLUMN "level" DROP NOT NULL;
    ALTER TABLE "subscription_plans" ALTER COLUMN "price" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Restoring NOT NULL will fail if any rows have NULL values in these
  // columns — that is intentional. The down should only succeed when the
  // data is consistent with the original constraints.
  await db.execute(sql`
    ALTER TABLE "subscription_plans" ALTER COLUMN "slug" SET NOT NULL;
    ALTER TABLE "subscription_plans" ALTER COLUMN "level" SET NOT NULL;
    ALTER TABLE "subscription_plans" ALTER COLUMN "price" SET NOT NULL;
  `)
}
