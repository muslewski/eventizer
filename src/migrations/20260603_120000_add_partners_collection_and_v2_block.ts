// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds:
 *   • partners collection            — main rows (orderable → _order varchar)
 *       - logo_id  (upload→media)    single-target FK column
 *       - offer_id (rel→offers)      single-target FK column
 *   • partnersV2 block on Pages      — pages_blocks_partners_v2 (+ versioned mirror)
 *       - partners hasMany           via pages_rels.partners_id / _pages_v_rels.partners_id
 *   • payload_locked_documents_rels.partners_id, payload_preferences_rels.partners_id
 *
 * All DDL idempotent — safe to re-run and safe on a dev DB already updated by push.
 * Registered in ALWAYS_RUN (scripts/prepare-migrations.mjs) so Vercel builds run it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ============ 1. partners collection ============
    DO $$ BEGIN
      CREATE TYPE "public"."enum_partners_accent_color"
        AS ENUM ('primary', 'accent', 'blue', 'emerald', 'violet', 'rose');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "partners" (
      "id"           serial  PRIMARY KEY NOT NULL,
      "name"         varchar NOT NULL,
      "tagline"      varchar,
      "quote"        varchar,
      "logo_id"      integer,
      "accent_color" "public"."enum_partners_accent_color" DEFAULT 'primary',
      "offer_id"     integer,
      "external_url" varchar,
      "_order"       varchar,
      "updated_at"   timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at"   timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "partners_order_idx"     ON "partners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "partners_logo_id_idx"   ON "partners" USING btree ("logo_id");
    CREATE INDEX IF NOT EXISTS "partners_offer_id_idx"  ON "partners" USING btree ("offer_id");
    CREATE INDEX IF NOT EXISTS "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "partners_created_at_idx" ON "partners" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "partners"
        ADD CONSTRAINT "partners_logo_id_media_id_fk"
        FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "partners"
        ADD CONSTRAINT "partners_offer_id_offers_id_fk"
        FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- ============ 2. payload_locked_documents_rels.partners_id ============
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "partners_id" integer;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_partners_id_idx"
      ON "payload_locked_documents_rels" USING btree ("partners_id");
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_partners_fk"
        FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- ============ 3. payload_preferences_rels.partners_id ============
    ALTER TABLE "payload_preferences_rels"
      ADD COLUMN IF NOT EXISTS "partners_id" integer;
    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_partners_id_idx"
      ON "payload_preferences_rels" USING btree ("partners_id");
    DO $$ BEGIN
      ALTER TABLE "payload_preferences_rels"
        ADD CONSTRAINT "payload_preferences_rels_partners_fk"
        FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- ============ 4. partnersV2 block — live table ============
    CREATE TABLE IF NOT EXISTS "pages_blocks_partners_v2" (
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
      ALTER TABLE "pages_blocks_partners_v2"
        ADD CONSTRAINT "pages_blocks_partners_v2_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_v2_order_idx"
      ON "pages_blocks_partners_v2" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_v2_parent_id_idx"
      ON "pages_blocks_partners_v2" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_partners_v2_path_idx"
      ON "pages_blocks_partners_v2" USING btree ("_path");

    -- ============ 5. partnersV2 block — versioned table ============
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_partners_v2" (
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
      ALTER TABLE "_pages_v_blocks_partners_v2"
        ADD CONSTRAINT "_pages_v_blocks_partners_v2_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_v2_order_idx"
      ON "_pages_v_blocks_partners_v2" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_v2_parent_id_idx"
      ON "_pages_v_blocks_partners_v2" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_partners_v2_path_idx"
      ON "_pages_v_blocks_partners_v2" USING btree ("_path");

    -- ============ 6. hasMany relationship plumbing (pages_rels / _pages_v_rels) ============
    ALTER TABLE "pages_rels"    ADD COLUMN IF NOT EXISTS "partners_id" integer;
    ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "partners_id" integer;

    CREATE INDEX IF NOT EXISTS "pages_rels_partners_id_idx"
      ON "pages_rels" USING btree ("partners_id", "locale");
    CREATE INDEX IF NOT EXISTS "_pages_v_rels_partners_id_idx"
      ON "_pages_v_rels" USING btree ("partners_id", "locale");

    DO $$ BEGIN
      ALTER TABLE "pages_rels"
        ADD CONSTRAINT "pages_rels_partners_fk"
        FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_rels"
        ADD CONSTRAINT "_pages_v_rels_partners_fk"
        FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Conservative reversal: drop the partnersV2 block tables and the partners
  // table, plus the partners_id columns that exist solely for this collection
  // (locked_documents_rels / preferences_rels). Leave the partners_id columns
  // on the shared pages_rels / _pages_v_rels in place (a future block could
  // reuse them; dropping risks data loss).
  await db.execute(sql`
    DROP TABLE IF EXISTS "_pages_v_blocks_partners_v2";
    DROP TABLE IF EXISTS "pages_blocks_partners_v2";

    ALTER TABLE "payload_preferences_rels"      DROP CONSTRAINT IF EXISTS "payload_preferences_rels_partners_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_partners_fk";
    ALTER TABLE "pages_rels"                    DROP CONSTRAINT IF EXISTS "pages_rels_partners_fk";
    ALTER TABLE "_pages_v_rels"                 DROP CONSTRAINT IF EXISTS "_pages_v_rels_partners_fk";

    ALTER TABLE "payload_preferences_rels"      DROP COLUMN IF EXISTS "partners_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "partners_id";

    DROP TABLE IF EXISTS "partners";
    DROP TYPE  IF EXISTS "public"."enum_partners_accent_color";
  `)
}
