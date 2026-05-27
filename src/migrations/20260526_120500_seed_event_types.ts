// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

/**
 * Seeds the 11 default event types. Idempotent on slug: re-running won't
 * duplicate rows, and won't UPDATE existing rows (so admin edits to names
 * or icons aren't reverted by a redeploy).
 *
 * Icons are left null — admin uploads them via the panel after deploy; the
 * wizard and listing strip render a Sparkles lucide fallback meanwhile.
 */
const DEFAULTS = [
  { name: 'Wesele',                         slug: 'wesele',                         order: 'a0' },
  { name: 'Event firmowy',                  slug: 'event-firmowy',                  order: 'a1' },
  { name: 'Urodziny',                       slug: 'urodziny',                       order: 'a2' },
  { name: 'Impreza prywatna',               slug: 'impreza-prywatna',               order: 'a3' },
  { name: 'Wieczór kawalerski / panieński', slug: 'wieczor-kawalerski-panienski',   order: 'a4' },
  { name: 'Studniówka / bal',               slug: 'studniowka-bal',                 order: 'a5' },
  { name: 'Chrzciny / komunie',             slug: 'chrzciny-komunie',               order: 'a6' },
  { name: 'Konferencja / gala',             slug: 'konferencja-gala',               order: 'a7' },
  { name: 'Festiwal / event masowy',        slug: 'festiwal-event-masowy',          order: 'a8' },
  { name: 'Sesja foto / produkcja',         slug: 'sesja-foto-produkcja',           order: 'a9' },
  { name: 'Inne',                           slug: 'inne',                           order: 'aa' },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const t of DEFAULTS) {
    await db.execute(sql`
      INSERT INTO "event_types" ("name", "slug", "is_active", "_order", "updated_at", "created_at")
      VALUES (${t.name}, ${t.slug}, true, ${t.order}, now(), now())
      ON CONFLICT ("slug") DO NOTHING
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Only delete the seeded defaults — leave any admin-created types alone.
  for (const t of DEFAULTS) {
    await db.execute(sql`DELETE FROM "event_types" WHERE "slug" = ${t.slug}`)
  }
}
