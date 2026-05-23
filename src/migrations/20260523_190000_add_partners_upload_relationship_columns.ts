// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Follow-up to 20260523_180000_add_partners_block.
 *
 * The first migration created the partner array tables but missed the
 * `logo_id` (upload→media) and `offer_id` (relationship→offers) columns.
 * Single-target upload and single-target relationship fields in Payload's
 * Drizzle adapter store as `<field>_id` columns directly on the parent
 * row — they do NOT flow through the polymorphic `pages_rels` table (that
 * pattern only applies to `hasMany: true` relationships and to true
 * polymorphic refs).
 *
 * Production build was failing prerender with:
 *   "column pages__blocks_partners_partners.logo_id does not exist"
 *
 * Idempotent — uses ADD COLUMN IF NOT EXISTS so it's a no-op on DBs that
 * already happen to have these columns from a dev push.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. Live array table — add logo_id (upload→media) and offer_id (rel→offers)
    ALTER TABLE "pages_blocks_partners_partners"
      ADD COLUMN IF NOT EXISTS "logo_id" integer;
    ALTER TABLE "pages_blocks_partners_partners"
      ADD COLUMN IF NOT EXISTS "offer_id" integer;

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_partners_partners"
        ADD CONSTRAINT "pages_blocks_partners_partners_logo_id_fk"
        FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_partners_partners"
        ADD CONSTRAINT "pages_blocks_partners_partners_offer_id_fk"
        FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_partners_logo_id_idx"
      ON "pages_blocks_partners_partners" USING btree ("logo_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_partners_offer_id_idx"
      ON "pages_blocks_partners_partners" USING btree ("offer_id");

    -- 2. Version array table — mirror the same columns
    ALTER TABLE "_pages_v_blocks_partners_partners"
      ADD COLUMN IF NOT EXISTS "logo_id" integer;
    ALTER TABLE "_pages_v_blocks_partners_partners"
      ADD COLUMN IF NOT EXISTS "offer_id" integer;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_partners_partners"
        ADD CONSTRAINT "_pages_v_blocks_partners_partners_logo_id_fk"
        FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_partners_partners"
        ADD CONSTRAINT "_pages_v_blocks_partners_partners_offer_id_fk"
        FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_partners_logo_id_idx"
      ON "_pages_v_blocks_partners_partners" USING btree ("logo_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_partners_offer_id_idx"
      ON "_pages_v_blocks_partners_partners" USING btree ("offer_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_partners_partners"   DROP COLUMN IF EXISTS "logo_id";
    ALTER TABLE "pages_blocks_partners_partners"   DROP COLUMN IF EXISTS "offer_id";
    ALTER TABLE "_pages_v_blocks_partners_partners" DROP COLUMN IF EXISTS "logo_id";
    ALTER TABLE "_pages_v_blocks_partners_partners" DROP COLUMN IF EXISTS "offer_id";
  `)
}
