// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Remediates a critical bug in the two preceding migrations:
 *   • event_types._order was created as `integer` but Payload's `orderable: true`
 *     requires `text`/`varchar` (it writes fractional-indexing keys like 'a0').
 *   • The seed inserted integers 100..1100 into that column.
 *
 * Without this remediation, admin "Create event type" and drag-to-reorder
 * actions fail with `invalid input syntax for type integer: "a0"`.
 *
 * This migration is idempotent:
 *   1. Only alters the column when it's still integer.
 *   2. Only updates seeded rows when their _order looks like one of our
 *      integer placeholders (100..1100). Admin-created or already-correct
 *      rows are left alone.
 *
 * Safe to re-run on any DB state (fresh, dev-pushed-as-integer, already-fixed).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      current_type text;
    BEGIN
      SELECT data_type INTO current_type
      FROM information_schema.columns
      WHERE table_name = 'event_types' AND column_name = '_order';

      IF current_type IS NULL THEN
        RAISE NOTICE 'event_types._order column missing — earlier migration must run first';
      ELSIF current_type = 'integer' THEN
        ALTER TABLE "event_types" ALTER COLUMN "_order" TYPE varchar USING "_order"::text;
        RAISE NOTICE 'event_types._order altered from integer to varchar';
      ELSE
        RAISE NOTICE 'event_types._order already %; no-op', current_type;
      END IF;
    END $$;

    UPDATE "event_types" SET "_order" = 'a0' WHERE "slug" = 'wesele'                       AND "_order" IN ('100', '100.0');
    UPDATE "event_types" SET "_order" = 'a1' WHERE "slug" = 'event-firmowy'                AND "_order" IN ('200', '200.0');
    UPDATE "event_types" SET "_order" = 'a2' WHERE "slug" = 'urodziny'                     AND "_order" IN ('300', '300.0');
    UPDATE "event_types" SET "_order" = 'a3' WHERE "slug" = 'impreza-prywatna'             AND "_order" IN ('400', '400.0');
    UPDATE "event_types" SET "_order" = 'a4' WHERE "slug" = 'wieczor-kawalerski-panienski' AND "_order" IN ('500', '500.0');
    UPDATE "event_types" SET "_order" = 'a5' WHERE "slug" = 'studniowka-bal'               AND "_order" IN ('600', '600.0');
    UPDATE "event_types" SET "_order" = 'a6' WHERE "slug" = 'chrzciny-komunie'             AND "_order" IN ('700', '700.0');
    UPDATE "event_types" SET "_order" = 'a7' WHERE "slug" = 'konferencja-gala'             AND "_order" IN ('800', '800.0');
    UPDATE "event_types" SET "_order" = 'a8' WHERE "slug" = 'festiwal-event-masowy'        AND "_order" IN ('900', '900.0');
    UPDATE "event_types" SET "_order" = 'a9' WHERE "slug" = 'sesja-foto-produkcja'         AND "_order" IN ('1000', '1000.0');
    UPDATE "event_types" SET "_order" = 'aa' WHERE "slug" = 'inne'                         AND "_order" IN ('1100', '1100.0');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Best-effort revert; only sensible to roll back when nothing real has been
  // added through the admin UI. Leaves admin-created rows alone.
  await db.execute(sql`
    UPDATE "event_types" SET "_order" = '100'  WHERE "slug" = 'wesele'                       AND "_order" = 'a0';
    UPDATE "event_types" SET "_order" = '200'  WHERE "slug" = 'event-firmowy'                AND "_order" = 'a1';
    UPDATE "event_types" SET "_order" = '300'  WHERE "slug" = 'urodziny'                     AND "_order" = 'a2';
    UPDATE "event_types" SET "_order" = '400'  WHERE "slug" = 'impreza-prywatna'             AND "_order" = 'a3';
    UPDATE "event_types" SET "_order" = '500'  WHERE "slug" = 'wieczor-kawalerski-panienski' AND "_order" = 'a4';
    UPDATE "event_types" SET "_order" = '600'  WHERE "slug" = 'studniowka-bal'               AND "_order" = 'a5';
    UPDATE "event_types" SET "_order" = '700'  WHERE "slug" = 'chrzciny-komunie'             AND "_order" = 'a6';
    UPDATE "event_types" SET "_order" = '800'  WHERE "slug" = 'konferencja-gala'             AND "_order" = 'a7';
    UPDATE "event_types" SET "_order" = '900'  WHERE "slug" = 'festiwal-event-masowy'        AND "_order" = 'a8';
    UPDATE "event_types" SET "_order" = '1000' WHERE "slug" = 'sesja-foto-produkcja'         AND "_order" = 'a9';
    UPDATE "event_types" SET "_order" = '1100' WHERE "slug" = 'inne'                         AND "_order" = 'aa';
    DO $$
    DECLARE
      current_type text;
    BEGIN
      SELECT data_type INTO current_type
      FROM information_schema.columns
      WHERE table_name = 'event_types' AND column_name = '_order';
      IF current_type = 'character varying' THEN
        ALTER TABLE "event_types" ALTER COLUMN "_order" TYPE integer USING "_order"::integer;
      END IF;
    END $$;
  `)
}
