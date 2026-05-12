// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Belt-and-suspenders fix: production diverged from the migration history.
 * The original migration `20260512_000000_processed_stripe_events_collection`
 * was tracked as run but the `processed_stripe_events` table does not exist
 * (cause unknown — likely a prior failed migration left a row in the
 * payload_migrations table without the actual DDL being applied). The fix-up
 * `20260512_133000_add_processed_stripe_events_to_locked_documents` then
 * couldn't add an FK referencing the missing table.
 *
 * This migration re-asserts the entire ProcessedStripeEvents schema using
 * fully idempotent DDL — every CREATE / ADD CONSTRAINT / CREATE INDEX uses
 * IF NOT EXISTS or DO $$ EXCEPTION blocks so it's a no-op on healthy DBs
 * and recovers broken ones.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. Enum type for changeType
    DO $$ BEGIN
      CREATE TYPE "public"."enum_processed_stripe_events_change_type"
        AS ENUM('upgrade', 'downgrade', 'lateral', 'interval_only', 'no_change', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 2. The table itself
    CREATE TABLE IF NOT EXISTS "processed_stripe_events" (
      "id"                  serial PRIMARY KEY NOT NULL,
      "event_id"            varchar NOT NULL,
      "event_type"          varchar NOT NULL,
      "user_id"             integer,
      "subscription_id"     varchar,
      "change_type"         "enum_processed_stripe_events_change_type",
      "prev_plan_slug"      varchar,
      "new_plan_slug"       varchar,
      "prev_level"          numeric,
      "new_level"           numeric,
      "drafted_by_category" numeric DEFAULT 0,
      "drafted_by_limit"    numeric DEFAULT 0,
      "processed_at"        timestamp(3) with time zone NOT NULL,
      "updated_at"          timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at"          timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- 3. Unique index on event_id (used for dedup query)
    CREATE UNIQUE INDEX IF NOT EXISTS "processed_stripe_events_event_id_idx"
      ON "processed_stripe_events" ("event_id");

    -- 4. FK to users
    DO $$ BEGIN
      ALTER TABLE "processed_stripe_events"
        ADD CONSTRAINT "processed_stripe_events_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 5. Column on payload_locked_documents_rels for Payload's lock-document FK
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "processed_stripe_events_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_processed_stripe_events_fk"
        FOREIGN KEY ("processed_stripe_events_id")
        REFERENCES "public"."processed_stripe_events"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_processed_stripe_events_id_idx"
      ON "payload_locked_documents_rels" USING btree ("processed_stripe_events_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Intentionally a no-op — reverting the table would lose audit history.
  // If you need to roll back, manually drop the table and re-run later.
}
