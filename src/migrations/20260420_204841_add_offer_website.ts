// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds the `socialMedia.website` field to the Offers collection at the DB level.
 *
 * Targeted + idempotent ALTERs on both the primary and versioned tables so this
 * migration is safe to re-run and coexists with the schema that Payload's dev
 * push has already created in other environments.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "social_media_website" varchar;
    ALTER TABLE "_offers_v" ADD COLUMN IF NOT EXISTS "version_social_media_website" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "offers" DROP COLUMN IF EXISTS "social_media_website";
    ALTER TABLE "_offers_v" DROP COLUMN IF EXISTS "version_social_media_website";
  `)
}
