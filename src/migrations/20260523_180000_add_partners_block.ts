// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds DB schema for the new Partners block on the Pages collection.
 *
 * The block has top-level fields plus a nested array of partners, each of
 * which may carry an upload (media) and a relationship (offers). Required
 * schema:
 *
 *   • pages_blocks_partners               — main block, per page
 *   • pages_blocks_partners_partners      — array rows, per partner
 *   • _pages_v_blocks_partners            — versioned mirror of main block
 *   • _pages_v_blocks_partners_partners   — versioned mirror of array
 *   • 4 enums (live + version × accentColor + linkType)
 *   • media_id column on pages_rels / _pages_v_rels for partner.logo uploads
 *     (offers_id already exists for partner.offer)
 *
 * Every DDL statement is idempotent (CREATE … IF NOT EXISTS / DO $$
 * EXCEPTION duplicate_object) so the migration is safe to re-run and safe to
 * apply on a dev DB that already has these tables from `payload db:push`.
 *
 * Registered in `ALWAYS_RUN` in scripts/prepare-migrations.mjs so production's
 * Vercel build actually executes it instead of marking it pre-applied.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. Enums (live + version variants — Payload uses separate enum names)
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_partners_partners_accent_color"
        AS ENUM ('primary', 'accent', 'blue', 'emerald', 'violet', 'rose');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_partners_partners_link_type"
        AS ENUM ('none', 'offer', 'external');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__pages_v_blocks_partners_partners_accent_color"
        AS ENUM ('primary', 'accent', 'blue', 'emerald', 'violet', 'rose');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__pages_v_blocks_partners_partners_link_type"
        AS ENUM ('none', 'offer', 'external');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 2. Main block table (live)
    CREATE TABLE IF NOT EXISTS "pages_blocks_partners" (
      "_order"           integer NOT NULL,
      "_parent_id"       integer NOT NULL,
      "_path"            text    NOT NULL,
      "id"               varchar PRIMARY KEY NOT NULL,
      "badge"            varchar DEFAULT 'Partnerzy',
      "heading"          varchar DEFAULT 'Partnerzy Eventizera',
      "description"      varchar DEFAULT 'Współpracujemy z zaufanymi miejscami i twórcami, którzy pomagają nam tworzyć niezapomniane wydarzenia. Poznaj naszych partnerów i sprawdź ich oferty na Eventizerze.',
      "rotation_seconds" numeric DEFAULT 8,
      "block_name"       varchar
    );

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_partners"
        ADD CONSTRAINT "pages_blocks_partners_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_order_idx"
      ON "pages_blocks_partners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_parent_id_idx"
      ON "pages_blocks_partners" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_path_idx"
      ON "pages_blocks_partners" USING btree ("_path");

    -- 3. Partners array sub-table (live)
    CREATE TABLE IF NOT EXISTS "pages_blocks_partners_partners" (
      "_order"       integer NOT NULL,
      "_parent_id"   varchar NOT NULL,
      "id"           varchar PRIMARY KEY NOT NULL,
      "name"         varchar,
      "tagline"      varchar,
      "quote"        varchar,
      "accent_color" "public"."enum_pages_blocks_partners_partners_accent_color" DEFAULT 'primary',
      "link_type"    "public"."enum_pages_blocks_partners_partners_link_type"    DEFAULT 'none',
      "external_url" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_partners_partners"
        ADD CONSTRAINT "pages_blocks_partners_partners_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_partners"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_partners_order_idx"
      ON "pages_blocks_partners_partners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_partners_parent_id_idx"
      ON "pages_blocks_partners_partners" USING btree ("_parent_id");

    -- 4. Main block table (versions)
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_partners" (
      "_order"           integer NOT NULL,
      "_parent_id"       integer NOT NULL,
      "_path"            text    NOT NULL,
      "id"               serial  PRIMARY KEY NOT NULL,
      "badge"            varchar DEFAULT 'Partnerzy',
      "heading"          varchar DEFAULT 'Partnerzy Eventizera',
      "description"      varchar DEFAULT 'Współpracujemy z zaufanymi miejscami i twórcami, którzy pomagają nam tworzyć niezapomniane wydarzenia. Poznaj naszych partnerów i sprawdź ich oferty na Eventizerze.',
      "rotation_seconds" numeric DEFAULT 8,
      "_uuid"            varchar,
      "block_name"       varchar
    );

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_partners"
        ADD CONSTRAINT "_pages_v_blocks_partners_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_order_idx"
      ON "_pages_v_blocks_partners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_parent_id_idx"
      ON "_pages_v_blocks_partners" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_path_idx"
      ON "_pages_v_blocks_partners" USING btree ("_path");

    -- 5. Partners array sub-table (versions)
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_partners_partners" (
      "_order"       integer NOT NULL,
      "_parent_id"   integer NOT NULL,
      "id"           serial  PRIMARY KEY NOT NULL,
      "name"         varchar,
      "tagline"      varchar,
      "quote"        varchar,
      "accent_color" "public"."enum__pages_v_blocks_partners_partners_accent_color" DEFAULT 'primary',
      "link_type"    "public"."enum__pages_v_blocks_partners_partners_link_type"    DEFAULT 'none',
      "external_url" varchar,
      "_uuid"        varchar
    );

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_partners_partners"
        ADD CONSTRAINT "_pages_v_blocks_partners_partners_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_partners"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_partners_order_idx"
      ON "_pages_v_blocks_partners_partners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_partners_parent_id_idx"
      ON "_pages_v_blocks_partners_partners" USING btree ("_parent_id");

    -- 6. Relationship plumbing — partner.logo is upload→media, so the
    -- polymorphic rels tables need a media_id column. (offers_id already
    -- exists for partner.offer relationships.)
    ALTER TABLE "pages_rels"   ADD COLUMN IF NOT EXISTS "media_id" integer;
    ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "media_id" integer;

    DO $$ BEGIN
      ALTER TABLE "pages_rels"
        ADD CONSTRAINT "pages_rels_media_id_fk"
        FOREIGN KEY ("media_id") REFERENCES "public"."media"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_rels"
        ADD CONSTRAINT "_pages_v_rels_media_id_fk"
        FOREIGN KEY ("media_id") REFERENCES "public"."media"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_rels_media_id_idx"
      ON "pages_rels" USING btree ("media_id", "locale");
    CREATE INDEX IF NOT EXISTS "_pages_v_rels_media_id_idx"
      ON "_pages_v_rels" USING btree ("media_id", "locale");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Conservative reversal: drop only the Partners-specific objects.
  // We deliberately leave the media_id column on the rels tables in place
  // because removing it would risk data loss if another block (added later)
  // started using it. Drop those manually if you really need to.
  await db.execute(sql`
    DROP TABLE IF EXISTS "_pages_v_blocks_partners_partners";
    DROP TABLE IF EXISTS "_pages_v_blocks_partners";
    DROP TABLE IF EXISTS "pages_blocks_partners_partners";
    DROP TABLE IF EXISTS "pages_blocks_partners";

    DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_partners_partners_link_type";
    DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_partners_partners_accent_color";
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_partners_partners_link_type";
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_partners_partners_accent_color";
  `)
}
