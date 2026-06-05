// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * partners.accent_color: enum → varchar hex. Converts any remaining enum-name
 * values to hex, then assigns a curated unique color per partner (keyed by stable
 * id — partner #8's live name differs from the seed), sets the gold default, and
 * drops the now-unused enum type. Idempotent; `partners` is not versioned.
 * Registered in ALWAYS_RUN (scripts/prepare-migrations.mjs) so Vercel runs it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "partners" ALTER COLUMN "accent_color" DROP DEFAULT;
    ALTER TABLE "partners" ALTER COLUMN "accent_color" TYPE varchar USING "accent_color"::text;

    UPDATE "partners" SET "accent_color" = CASE "accent_color"
      WHEN 'primary' THEN '#0B0B0B' WHEN 'accent' THEN '#E4A00B'
      WHEN 'blue' THEN '#3B82F6'    WHEN 'emerald' THEN '#10B981'
      WHEN 'violet' THEN '#8B5CF6'  WHEN 'rose' THEN '#F43F5E'
      ELSE "accent_color" END
    WHERE "accent_color" !~ '^#';

    UPDATE "partners" SET "accent_color" = '#0B0B0B' WHERE "id" = 1;  -- SkyClub Białystok
    UPDATE "partners" SET "accent_color" = '#3B82F6' WHERE "id" = 2;  -- Meetly
    UPDATE "partners" SET "accent_color" = '#10B981' WHERE "id" = 3;  -- Zielona Lipka (kept)
    UPDATE "partners" SET "accent_color" = '#8B5CF6' WHERE "id" = 4;  -- pod Gromadzyniem
    UPDATE "partners" SET "accent_color" = '#F43F5E' WHERE "id" = 5;  -- Princess Palace
    UPDATE "partners" SET "accent_color" = '#E4A00B' WHERE "id" = 6;  -- DJ SPDR
    UPDATE "partners" SET "accent_color" = '#F97316' WHERE "id" = 7;  -- Misiak Events
    UPDATE "partners" SET "accent_color" = '#EC4899' WHERE "id" = 8;  -- Wesele na głowie
    UPDATE "partners" SET "accent_color" = '#14B8A6' WHERE "id" = 9;  -- Santiago Events
    UPDATE "partners" SET "accent_color" = '#6366F1' WHERE "id" = 10; -- Na Łośmiu Metrach

    ALTER TABLE "partners" ALTER COLUMN "accent_color" SET DEFAULT '#E4A00B';
    DROP TYPE IF EXISTS "enum_partners_accent_color";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Non-restoring: the enum→hex value conversion is lossy. Only reset the default.
  await db.execute(sql`
    ALTER TABLE "partners" ALTER COLUMN "accent_color" DROP DEFAULT;
  `)
}
