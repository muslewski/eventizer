// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds the `zoom` column to offer_uploads for the image position editor.
 * OfferUploads has no draft/version table, so only the primary table is touched.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "offer_uploads" ADD COLUMN IF NOT EXISTS "zoom" numeric DEFAULT 1;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "offer_uploads" DROP COLUMN IF EXISTS "zoom";
  `)
}
