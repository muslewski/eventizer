# Sign-in Real Stats + Partner Logos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fabricated sign-in hero stats with honest beta numbers and turn the four placeholder "Zaufali nam najlepsi" circles into real, admin-curated partner logos.

**Architecture:** Four prop-string edits in the two `auth/.../layout.tsx` files; a new `showOnSignIn` checkbox on the existing `partners` collection (with its DB migration); and a new async server component `TrustedPartners` that queries flagged-with-logo partners and renders up to four logo circles, replacing the hardcoded block inside the shared `MediumImpact` hero `Content`.

**Tech Stack:** Next.js 16 App Router (RSC), Payload CMS (`@payloadcms/db-vercel-postgres`), TypeScript, Tailwind, `motion/react` (via existing `BlurText`).

**Spec:** [`eventizer-mind/specs/2026-06-05-sign-in-real-stats-partner-logos-design.md`](../specs/2026-06-05-sign-in-real-stats-partner-logos-design.md)

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `src/app/(frontend)/[lang]/auth/(service-provider)/layout.tsx` | Service-provider sign-in stats | Modify (2 strings) |
| `src/app/(frontend)/[lang]/auth/(client)/layout.tsx` | Client sign-in stats | Modify (2 strings) |
| `src/collections/Partners.ts` | Partner schema — add `showOnSignIn` checkbox | Modify |
| `src/migrations/20260605_120000_add_partner_show_on_sign_in.ts` | DB column for `show_on_sign_in` | Create |
| `src/migrations/index.ts` | Migration registry | Modify |
| `scripts/prepare-migrations.mjs` | Vercel migration runner — `ALWAYS_RUN` set | Modify |
| `src/heros/MediumImpact/Content/TrustedPartners.tsx` | Async: query + render partner logos / empty state | Create |
| `src/heros/MediumImpact/Content/index.tsx` | Hero left-column content — swap circles for `<TrustedPartners />` | Modify |
| `eventizer-mind/map/zones/auth.md` | Zone card — re-stamp `verifiedAt` | Modify |
| `eventizer-mind/map/zones/content-blocks.md` | Zone card — re-stamp `verifiedAt` | Modify |
| `eventizer-mind/map/decisions/partner-show-on-sign-in.md` | "Why" record | Create |

### Note on testing strategy

This change is a static-copy edit + a thin Payload query feeding a presentational RSC. The
existing `Partners` / `PartnersV2` blocks (the same query+render pattern) ship with **no** unit
tests because a meaningful test needs a live Payload DB (integration-tier), and mocking
`getPayload` would test the mock, not the behavior. We follow that precedent: verification is via
`pnpm generate:types` (compile), `pnpm payload migrate` (DB), `pnpm lint`, and a manual checklist
(Task 6). Do **not** invent brittle `getPayload` mocks.

---

## Task 1: Honest sign-in stats

**Files:**
- Modify: `src/app/(frontend)/[lang]/auth/(service-provider)/layout.tsx:61-64`
- Modify: `src/app/(frontend)/[lang]/auth/(client)/layout.tsx:61-64`

- [ ] **Step 1: Update service-provider stats**

In `src/app/(frontend)/[lang]/auth/(service-provider)/layout.tsx`, replace the two stat props:

```tsx
      informationTitle1="500+"
      informationValue1="Zarejestrowanych użytkowników"
      informationTitle2="50"
      informationValue2="Wydarzeń miesięcznie"
```

(Was `200K+` / `5K+`. The value labels are unchanged.)

- [ ] **Step 2: Update client stats**

In `src/app/(frontend)/[lang]/auth/(client)/layout.tsx`, replace the two stat props:

```tsx
      informationTitle1="100+"
      informationValue1="Aktywnych usług"
      informationTitle2="10"
      informationValue2="Branż eventowych"
```

(Was `70K+` / `120+`. The value labels are unchanged.)

- [ ] **Step 3: Verify lint passes**

Run: `pnpm lint`
Expected: PASS (no new errors).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/[lang]/auth/(service-provider)/layout.tsx" "src/app/(frontend)/[lang]/auth/(client)/layout.tsx"
git commit -m "feat(auth): honest beta stats on sign-in heroes"
```

---

## Task 2: Add `showOnSignIn` checkbox to the partners collection

**Files:**
- Modify: `src/collections/Partners.ts:137` (after the `externalUrl` field, last in `fields`)

- [ ] **Step 1: Add the field**

In `src/collections/Partners.ts`, add this as the **last** entry of the `fields` array (after the
`externalUrl` field object, before the closing `]`):

```ts
    {
      name: 'showOnSignIn',
      type: 'checkbox',
      defaultValue: false,
      label: { en: 'Show on sign-in screen', pl: 'Pokaż na ekranie logowania' },
      admin: {
        description: {
          en: 'Show this partner in the "Zaufali nam najlepsi" row on the sign-in screens. Only partners with a logo appear; max 4, ordered by the list drag-order.',
          pl: 'Pokaż tego partnera w sekcji "Zaufali nam najlepsi" na ekranach logowania. Wyświetlani są tylko partnerzy z logo; maks. 4, w kolejności z listy.',
        },
      },
    },
```

- [ ] **Step 2: Regenerate Payload types**

Run: `pnpm generate:types`
Expected: completes; `src/payload-types.ts` `Partner` interface now includes
`showOnSignIn?: boolean | null`.

- [ ] **Step 3: Verify the type landed**

Run: `grep -n "showOnSignIn" src/payload-types.ts`
Expected: at least one match on the `Partner` interface.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Partners.ts src/payload-types.ts
git commit -m "feat(partners): add showOnSignIn checkbox field"
```

---

## Task 3: Migration for the `show_on_sign_in` column

**Background:** Dev auto-pushes schema, but the Vercel build runs `payload migrate` before
`next build` prerender. A new field with no migration → prod build fails with "column
show_on_sign_in does not exist". The `partners` collection is **not** versioned (no `versions`
config), so there is no `_partners_v` mirror table — a single `ALTER TABLE "partners"` is
sufficient. **Critical:** `scripts/prepare-migrations.mjs` pre-marks every migration NOT in
`ALWAYS_RUN` as already-applied, so a new migration omitted from that set will silently never run
on Vercel. It must be added to `ALWAYS_RUN`.

**Files:**
- Create: `src/migrations/20260605_120000_add_partner_show_on_sign_in.ts`
- Modify: `src/migrations/index.ts`
- Modify: `scripts/prepare-migrations.mjs:56-65` (the `ALWAYS_RUN` set)

- [ ] **Step 1: Write the migration**

Create `src/migrations/20260605_120000_add_partner_show_on_sign_in.ts`:

```ts
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
```

- [ ] **Step 2: Register in the migration index**

In `src/migrations/index.ts`, add the import after the last existing import (the
`20260603_120500_seed_partners` line):

```ts
import * as migration_20260605_120000_add_partner_show_on_sign_in from './20260605_120000_add_partner_show_on_sign_in';
```

And add this object as the **last** entry of the `migrations` array (after the
`20260603_120500_seed_partners` object):

```ts
  {
    up: migration_20260605_120000_add_partner_show_on_sign_in.up,
    down: migration_20260605_120000_add_partner_show_on_sign_in.down,
    name: '20260605_120000_add_partner_show_on_sign_in'
  },
```

- [ ] **Step 3: Add to `ALWAYS_RUN`**

In `scripts/prepare-migrations.mjs`, add the migration name as the **last** entry of the
`ALWAYS_RUN` set (after `'20260603_120500_seed_partners'`):

```js
  '20260605_120000_add_partner_show_on_sign_in',
```

- [ ] **Step 4: Apply the migration locally**

Run: `pnpm payload migrate`
Expected: runs without error; reports the new migration applied (or no-op if dev-push already
added the column — the `IF NOT EXISTS` makes this safe).

- [ ] **Step 5: Confirm the column references are complete**

Run: `grep -rn "show_on_sign_in" src/migrations/`
Expected: matches only in `20260605_120000_add_partner_show_on_sign_in.ts` (up + down). No
versioned `_v` table is expected for `partners`.

- [ ] **Step 6: Commit**

```bash
git add src/migrations/20260605_120000_add_partner_show_on_sign_in.ts src/migrations/index.ts scripts/prepare-migrations.mjs
git commit -m "feat(partners): migration for show_on_sign_in column"
```

---

## Task 4: `TrustedPartners` async component

**Files:**
- Create: `src/heros/MediumImpact/Content/TrustedPartners.tsx`

- [ ] **Step 1: Create the component**

Create `src/heros/MediumImpact/Content/TrustedPartners.tsx`:

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import Image from 'next/image'
import BlurText from '@/components/react-bits/BlurText'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { cn } from '@/lib/utils'
import type { Media, Partner } from '@/payload-types'

const logoUrl = (partner: Partner): string | null => {
  if (!partner.logo) return null
  if (isExpandedDoc<Media>(partner.logo)) return partner.logo.url ?? null
  return null
}

export const TrustedPartners = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'partners',
    where: {
      showOnSignIn: { equals: true },
      logo: { exists: true },
    },
    sort: '_order',
    limit: 4,
    depth: 1,
  })

  const partners = docs
    .map((partner) => ({ partner, url: logoUrl(partner) }))
    .filter((entry): entry is { partner: Partner; url: string } => Boolean(entry.url))

  if (partners.length === 0) return null

  return (
    <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 2xl:gap-12">
      <h3 className="xl:text-5xl md:text-4xl sm:text-3xl text-2xl font-bebas max-w-7xl text-white dark:mix-blend-difference transform-gpu">
        <BlurText
          text="Zaufali nam najlepsi"
          animateBy="letters"
          direction="bottom"
          delay={50}
          startDelay={250}
        />
      </h3>

      <div className="flex">
        {partners.map(({ partner, url }, index) => (
          <div
            key={partner.id}
            className={cn(
              'size-16 md:size-24 rounded-full overflow-hidden bg-white ring-1 ring-white/20 flex items-center justify-center',
              index > 0 && '-ml-4 md:-ml-6',
            )}
          >
            <Image
              src={url}
              alt={`${partner.name} logo`}
              width={96}
              height={96}
              className="size-full object-contain p-2"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

Notes: `logoUrl` mirrors `partnerLogoUrl` in `src/blocks/Partners/Component.client.tsx:94-98`
(same `isExpandedDoc<Media>` resolution). `sort: '_order'` uses the orderable collection's manual
admin drag-order. The light-circle + `object-contain p-2` treatment shows full-color brand logos
(the approved default).

- [ ] **Step 2: Type-check the new file compiles**

Run: `pnpm generate:types && pnpm lint`
Expected: PASS. (If `where.showOnSignIn` errors, Task 2's `generate:types` was skipped — rerun it.)

- [ ] **Step 3: Commit**

```bash
git add "src/heros/MediumImpact/Content/TrustedPartners.tsx"
git commit -m "feat(auth): TrustedPartners component for sign-in partner logos"
```

---

## Task 5: Wire `TrustedPartners` into the hero content

**Files:**
- Modify: `src/heros/MediumImpact/Content/index.tsx` (remove `BlurText` import + the hardcoded
  heading/circles block; render `<TrustedPartners />`)

- [ ] **Step 1: Swap the import**

In `src/heros/MediumImpact/Content/index.tsx`, replace the `BlurText` import (line 5):

```tsx
import BlurText from '@/components/react-bits/BlurText'
```

with:

```tsx
import { TrustedPartners } from './TrustedPartners'
```

(`BlurText` is no longer referenced in this file — it moved into `TrustedPartners`.)

- [ ] **Step 2: Replace the hardcoded "Trusted Us" block**

Replace the entire `{/* Trusted Us */}` block (the `<div className="flex flex-col gap-4 ...">`
containing the `<h3>` BlurText heading and the four placeholder circles — currently lines ~49-68):

```tsx
      {/* Trusted Us */}
      <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 2xl:gap-12">
        <h3 className="xl:text-5xl md:text-4xl sm:text-3xl text-2xl font-bebas max-w-7xl text-white dark:mix-blend-difference transform-gpu">
          {/* Zaufali nam najlepsi */}
          <BlurText
            text="Zaufali nam najlepsi"
            animateBy="letters"
            direction="bottom"
            delay={50}
            startDelay={250}
          />
        </h3>

        <div className="flex">
          <div className="size-16 md:size-24 bg-white/15 mix-blend-difference rounded-full" />
          <div className="size-16 md:size-24 bg-white/15 mix-blend-difference rounded-full -ml-4 md:-ml-6" />
          <div className="size-16 md:size-24 bg-white/15 mix-blend-difference rounded-full -ml-4 md:-ml-6" />
          <div className="size-16 md:size-24 bg-white/15 mix-blend-difference rounded-full -ml-4 md:-ml-6" />
        </div>
      </div>
```

with:

```tsx
      {/* Trusted Us — real partner logos (showOnSignIn) */}
      <TrustedPartners />
```

Leave everything else (`Links`, `Stats`, the bottom scroll-indicator row) untouched. Because
`Content` is a server component, rendering the async `<TrustedPartners />` child is valid RSC — no
`await` needed in `Content`.

- [ ] **Step 3: Verify lint + types pass**

Run: `pnpm lint`
Expected: PASS, with no "BlurText is defined but never used" warning (the import was removed).

- [ ] **Step 4: Commit**

```bash
git add "src/heros/MediumImpact/Content/index.tsx"
git commit -m "feat(auth): render real partner logos in sign-in trust row"
```

---

## Task 6: Manual verification

No automated test covers the RSC + DB path (see "Note on testing strategy"). Verify by hand
against the local dev DB.

- [ ] **Step 1: Start the app**

Run: `pnpm dev` (or the project's run skill).

- [ ] **Step 2: Empty state**

With no partner having `showOnSignIn` ticked, open `/pl/auth/...` for both the client and
service-provider sign-in screens.
Expected: the "Zaufali nam najlepsi" heading and the logo row are **absent** (no fake circles, no
lonely heading). New stat numbers show: service-provider `500+` / `50`, client `100+` / `10`.

- [ ] **Step 3: Logo'd partner**

In Payload admin (`/admin` → Partnerzy Eventizer), tick `Pokaż na ekranie logowania` on 1–4
partners that **have a logo** uploaded, set their drag-order, save.
Expected: their logos appear (full color, in a light circle) on **both** sign-in screens, in
drag-order, capped at 4.

- [ ] **Step 4: Missing-logo partner is skipped**

Tick `showOnSignIn` on a partner with **no** logo.
Expected: it does **not** appear in the row (logo-only filter).

- [ ] **Step 5: No commit** — verification only.

---

## Task 7: Mind maintenance (same change, not a follow-up)

**Files:**
- Modify: `eventizer-mind/map/zones/auth.md` (frontmatter `verifiedAt`)
- Modify: `eventizer-mind/map/zones/content-blocks.md` (frontmatter `verifiedAt`)
- Create: `eventizer-mind/map/decisions/partner-show-on-sign-in.md`

- [ ] **Step 1: Capture the post-implementation HEAD**

Run: `git rev-parse HEAD`
Expected: a commit hash — call it `<HEAD>`. Use it for both `verifiedAt` stamps below.

- [ ] **Step 2: Write the decision record**

Create `eventizer-mind/map/decisions/partner-show-on-sign-in.md`:

```markdown
---
type: decision
summary: "Sign-in 'Zaufali nam najlepsi' logos are driven by a showOnSignIn checkbox on the partners collection (logo-only, max 4, drag-ordered), and the fake hero stats were replaced with honest beta numbers."
tags: [auth, sign-in, partners, payload]
status: active
created: 2026-06-05
updated: 2026-06-05
related: ["[[auth]]", "[[content-blocks]]", "[[partners-promoted-to-collection]]"]
sources: ["[[2026-06-05-sign-in-real-stats-partner-logos-design]]"]
decided: 2026-06-05
supersededBy: ""
---

# Sign-in trust row reuses the partners collection; honest hero stats

## Context
The two sign-in heroes (`MediumImpact`) showed fabricated stats (`200K+` users, `5K+`/`70K+`/`120+`)
and a "Zaufali nam najlepsi" row of four empty placeholder circles. We already store real partner
content in the `partners` collection (see [[partners-promoted-to-collection]]).

## Decision
- Hero stats are now honest beta numbers: service-provider `500+` Zarejestrowanych użytkowników /
  `50` Wydarzeń miesięcznie; client `100+` Aktywnych usług / `10` Branż eventowych — plain prop
  strings on the two `auth/.../layout.tsx` files.
- A new `showOnSignIn` checkbox on `partners` curates the trust row. An async `TrustedPartners`
  server component (`src/heros/MediumImpact/Content/TrustedPartners.tsx`) queries partners where
  `showOnSignIn = true AND logo exists`, `sort: '_order'`, `limit: 4`, and renders their logos;
  it returns `null` (heading included) when none qualify.

## Why
Reuse the single partner source of truth rather than a second list. Logo-only + empty-state-hides
keeps the screen honest: a flagged partner with no logo simply doesn't show, which is the signal
to upload its logo. Both sign-in screens share `MediumImpact` `Content`, so they show the same
curated set with no per-screen wiring.

## Consequences
Adding the checkbox added the `partners.show_on_sign_in` column via
`src/migrations/20260605_120000_add_partner_show_on_sign_in.ts` (registered in `ALWAYS_RUN`), per
[[migrate-before-next-build]]. Sourcing partner logos from their websites is deferred to admins.
```

- [ ] **Step 3: Re-stamp the auth zone card**

In `eventizer-mind/map/zones/auth.md`, set frontmatter `verifiedAt: "<HEAD>"`. Append a brief line
to the Purpose/anchors noting the sign-in heroes now show honest stats + collection-driven partner
logos (the `auth/**` layouts feed `MediumImpact`).

- [ ] **Step 4: Re-stamp the content-blocks zone card**

In `eventizer-mind/map/zones/content-blocks.md`, set frontmatter `verifiedAt: "<HEAD>"`. Note that
`partners` now carries a `showOnSignIn` flag consumed by `src/heros/MediumImpact/Content/TrustedPartners.tsx`.

- [ ] **Step 5: Rebuild + validate the Mind index**

Run: `pnpm mind:check`
Expected: passes; `eventizer-mind/map/index.md` regenerated, no stale-zone errors for the two
touched zones.

- [ ] **Step 6: Commit**

```bash
git add eventizer-mind/
git commit -m "docs(mind): record sign-in stats + partner-logo decision, re-stamp zones"
```

---

## Self-Review

**Spec coverage:**
- Honest stats (both screens) → Task 1. ✓
- `showOnSignIn` checkbox → Task 2. ✓
- Migration / `ALWAYS_RUN` → Task 3. ✓
- `TrustedPartners` (logo-only, max 4, `_order`, empty→null) → Tasks 4–5. ✓
- Light-circle full-color logo treatment → Task 4 Step 1. ✓
- Logo sourcing out of scope → not implemented (correct); manual verify skips it. ✓
- Mind upkeep (zone re-stamp + decision + `mind:check`) → Task 7. ✓

**Placeholder scan:** none — every code/SQL step is complete.

**Type consistency:** `logoUrl(partner)` (Task 4) is the only helper; `showOnSignIn` matches the
field name in Task 2 and the migration column `show_on_sign_in` (Task 3); migration name
`20260605_120000_add_partner_show_on_sign_in` is identical across the file, index, and `ALWAYS_RUN`.
