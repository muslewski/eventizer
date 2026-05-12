// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Creates the `processed_stripe_events` table used for Stripe webhook
 * idempotency (dedup by eventId) and audit trail of subscription changes.
 *
 * Targeted + idempotent — safe to re-run in environments where Payload's
 * dev push has already created the table.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_processed_stripe_events_change_type"
        AS ENUM('upgrade', 'downgrade', 'lateral', 'interval_only', 'no_change', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

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

    CREATE UNIQUE INDEX IF NOT EXISTS "processed_stripe_events_event_id_idx"
      ON "processed_stripe_events" ("event_id");

    DO $$ BEGIN
      ALTER TABLE "processed_stripe_events"
        ADD CONSTRAINT "processed_stripe_events_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "processed_stripe_events"
      DROP CONSTRAINT IF EXISTS "processed_stripe_events_user_id_users_id_fk";

    DROP TABLE IF EXISTS "processed_stripe_events";

    DROP TYPE IF EXISTS "public"."enum_processed_stripe_events_change_type";
  `)
}
