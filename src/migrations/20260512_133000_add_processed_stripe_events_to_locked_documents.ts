// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Fix-up: PR #32's `processed_stripe_events` collection migration created the
 * table but forgot to ALTER `payload_locked_documents_rels` to add the
 * `processed_stripe_events_id` FK column. Payload's runtime auto-includes a
 * column for every collection when querying `payload_locked_documents_rels`,
 * so every read against that table fails in production with:
 *   column "processed_stripe_events_id" does not exist
 *
 * This migration adds the missing column, FK constraint, and index. Idempotent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_processed_stripe_events_id_idx";

    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_processed_stripe_events_fk";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "processed_stripe_events_id";
  `)
}
