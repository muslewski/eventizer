// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Adds partners.show_on_sign_in — boolean flag selecting which partners appear
 * in the "Zaufali nam najlepsi" row on the sign-in heroes. Idempotent; safe on a
 * dev DB already updated by push. `partners` is not versioned → no _v mirror.
 * Registered in ALWAYS_RUN (scripts/prepare-migrations.mjs) so Vercel runs it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "partners"
      ADD COLUMN IF NOT EXISTS "show_on_sign_in" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "partners"
      DROP COLUMN IF EXISTS "show_on_sign_in";
  `)
}
