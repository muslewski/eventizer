// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds the `event_types` collection table plus the relationship-link columns
 * that Payload's Postgres adapter requires for the new `eventTypes hasMany`
 * relationship on Offers (added in the same release).
 *
 * Tables affected:
 *   • event_types               — main rows
 *   • offers_rels               — gains event_types_id column for the live relation
 *   • _offers_v_rels            — gains event_types_id column for the versioned relation
 *   • payload_locked_documents_rels — needs the column for cross-collection lock indexing
 *   • payload_preferences_rels  — needs the column for admin UI preferences
 *
 * Every DDL is idempotent (IF NOT EXISTS) so re-running on a dev DB that
 * already has these via `payload db:push` is safe.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. Main table
    CREATE TABLE IF NOT EXISTS "event_types" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "icon_id" integer,
      "description" varchar,
      "is_active" boolean DEFAULT true NOT NULL,
      "_order" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "event_types_slug_idx"
      ON "event_types" USING btree ("slug");

    CREATE INDEX IF NOT EXISTS "event_types_icon_idx"
      ON "event_types" USING btree ("icon_id");

    -- 3. FK from event_types.icon_id to media
    DO $$ BEGIN
      ALTER TABLE "event_types"
        ADD CONSTRAINT "event_types_icon_id_media_id_fk"
        FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 4. offers_rels and _offers_v_rels: create if not yet pushed by Payload,
    --    then add event_types_id column.
    --
    --    These tables only appear once Offers gains its first hasMany relationship
    --    (this release). On a fresh production deploy the tables will not exist
    --    until next build (db push) runs — so we create them here first. On a dev
    --    DB that already had db push run, the CREATE IF NOT EXISTS is a no-op.
    CREATE TABLE IF NOT EXISTS "offers_rels" (
      "id"             serial  PRIMARY KEY NOT NULL,
      "order"          integer,
      "parent_id"      integer NOT NULL,
      "path"           varchar NOT NULL,
      "event_types_id" integer
    );

    CREATE TABLE IF NOT EXISTS "_offers_v_rels" (
      "id"             serial  PRIMARY KEY NOT NULL,
      "order"          integer,
      "parent_id"      integer NOT NULL,
      "path"           varchar NOT NULL,
      "event_types_id" integer
    );

    -- FKs for the rels tables themselves
    DO $$ BEGIN
      ALTER TABLE "offers_rels"
        ADD CONSTRAINT "offers_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."offers"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_offers_v_rels"
        ADD CONSTRAINT "_offers_v_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."_offers_v"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "offers_rels_order_idx"
      ON "offers_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "offers_rels_parent_idx"
      ON "offers_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "offers_rels_path_idx"
      ON "offers_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "_offers_v_rels_order_idx"
      ON "_offers_v_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_offers_v_rels_parent_idx"
      ON "_offers_v_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_offers_v_rels_path_idx"
      ON "_offers_v_rels" USING btree ("path");

    -- In case db:push already created the table without event_types_id, add it now
    ALTER TABLE "offers_rels" ADD COLUMN IF NOT EXISTS "event_types_id" integer;
    ALTER TABLE "_offers_v_rels" ADD COLUMN IF NOT EXISTS "event_types_id" integer;

    CREATE INDEX IF NOT EXISTS "offers_rels_event_types_id_idx"
      ON "offers_rels" USING btree ("event_types_id");
    CREATE INDEX IF NOT EXISTS "_offers_v_rels_event_types_id_idx"
      ON "_offers_v_rels" USING btree ("event_types_id");

    DO $$ BEGIN
      ALTER TABLE "offers_rels"
        ADD CONSTRAINT "offers_rels_event_types_fk"
        FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_offers_v_rels"
        ADD CONSTRAINT "_offers_v_rels_event_types_fk"
        FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 5. payload_locked_documents_rels — Payload indexes every collection here
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "event_types_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_event_types_id_idx"
      ON "payload_locked_documents_rels" USING btree ("event_types_id");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_event_types_fk"
        FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 6. payload_preferences_rels — needed for admin UI preferences
    ALTER TABLE "payload_preferences_rels"
      ADD COLUMN IF NOT EXISTS "event_types_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_event_types_id_idx"
      ON "payload_preferences_rels" USING btree ("event_types_id");

    DO $$ BEGIN
      ALTER TABLE "payload_preferences_rels"
        ADD CONSTRAINT "payload_preferences_rels_event_types_fk"
        FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "event_types_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "event_types_id";
    ALTER TABLE "_offers_v_rels" DROP COLUMN IF EXISTS "event_types_id";
    ALTER TABLE "offers_rels" DROP COLUMN IF EXISTS "event_types_id";
    DROP TABLE IF EXISTS "event_types";
  `)
}
