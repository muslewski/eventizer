---
type: spec
summary: "A repository knowledge system ('the Mind') that makes Eventizer agent-native and human-queryable. An Obsidian-compatible vault is the single source of truth for the Map (what/where is now) and the Ledger (why/how we built it); CLAUDE.md, skills, the generator and the SessionStart hook are projections into it, never copies. A verifying generator keeps the Map honest against the code."
tags: [the-mind, knowledge-base, agent-native, meta]
status: draft
created: 2026-06-02
updated: 2026-06-02
related: []
sources: []
origin: "User request to set up 'the Mind' repository knowledge system, adapting a proven recipe to Eventizer; brainstormed 2026-06-02. The recipe's philosophy is reproduced faithfully; only the field-specific mechanics are adapted to a repo that already has hand-authored skills and a docs/superpowers ledger."
---

# Eventizer Mind — Design

## 1. Context & motivation

Eventizer is **not a blank repo**. Two-thirds of the "Mind" already exists, in a different form:

- **The Map already exists as 6 hand-authored skills** under `.claude/skills/`: `eventizer-architecture`, `eventizer-design-tokens`, `eventizer-offers-wizard`, `eventizer-panel-conventions`, `eventizer-payload-migrations`, `eventizer-server-actions`. They are dense, accurate, and — crucially — **auto-trigger by their `description`**, a retrieval mechanism plain markdown does not have.
- **The Ledger already exists** as `docs/superpowers/specs/` (11 specs) + `docs/superpowers/plans/` (10 plans). The brainstorm → plan → implement loop has been in use for months.

What is genuinely **missing**, and is the real value this project adds:

1. **Verification** — nothing checks that the skills' file/line references still resolve; they can silently rot.
2. **Decision records (ADRs)** — the "why" is scattered across specs + git history with no dedicated home.
3. **A generated index** with per-zone freshness + anchor-resolution status.
4. **A real `CLAUDE.md`** — there is none; only a stale, generic `.github/copilot-instructions.md` and a boilerplate `README.md`.
5. **A queryable graph + lineage** linking prompt → idea → spec → plan → zone card / decision.

There is **no CI** (`.github/workflows/` is absent), so the recipe's "gate the generator in CI" becomes "gate it in a local check command + the SessionStart hook + the finish-rule in CLAUDE.md."

Package manager is **pnpm** (resolved during brainstorming — every `package.json` script and all 6 skills use pnpm; `bun.lock` and the copilot file's "use bun" advice are stale drift, to be cleaned up and recorded as the first decision record).

## 2. The core decision: vault is canonical, skills are auto-triggering projections

We split knowledge **by type, not by location** — the recipe's "projections, never copies" done in the way that best serves an AI consumer. The decisive fact: **skills auto-trigger when relevant; vault notes are passive.** Deleting the skills (pure "full fold-in") would yield a beautiful knowledge base that silently fails to reach the agent mid-task. So the descriptive/map content folds *out of* the skills *into* the vault (making the vault the substantive single source of truth), while each skill stays as a **lean, auto-triggering projection** that carries the load-bearing procedural gotchas and points to its `[[zone card]]` for the full map, the why, and the lineage.

| Knowledge type | Canonical home | How it reaches the agent |
|---|---|---|
| **What / where it is now** (zones, globs, routes, invariants, `verifiedAt` SHA) | **Vault** `map/zones/` | CLAUDE.md "orient first" + skill pointer |
| **Why** (ADRs) — *brand new; nothing has this today* | **Vault** `map/decisions/` | linked from zone cards |
| **Intent / history** (specs → plans → what shipped) | **Vault** ledger (existing `docs/superpowers/*` relocates in) | lineage links |
| **How to work in it** (procedural gotchas) | **Skills** (kept, refactored to lean) | **auto-trigger** |

```
                          eventizer-mind/   ← SINGLE SOURCE OF TRUTH
        ┌──────────────────────┴──────────────────────┐
     THE MAP (present, mutable)             THE LEDGER (past, read-only once consumed)
     map/zones/      what/where now          specs/   intent
     map/decisions/  WHY (ADRs) ← NEW        plans/   how we built it
     map/flows/      cross-zone journeys     ideas/   maybe-laters
     map/entities/   load-bearing intent     tech-debt/ deferrals
     map/index.md    GENERATED, verified
        │   lineage: prompt → idea → spec → plan → zone card / decision
        ▼
   PROJECTIONS (never copies):
     CLAUDE.md ............ "orient Mind-first" dev rule + pipeline override
     6 eventizer-* skills . auto-trigger; procedural gotchas inline; point to [[zone]]
     scripts/mind/ ........ generator + SessionStart hook (the verifier)
     /map-sync ............ rebuild + validate the index
```

## 3. Vault scaffold & property schema

Location: **`eventizer-mind/`** at repo root (the recipe default `<project>-mind`).

```
eventizer-mind/
  map/{zones,decisions,flows,entities}/   ← the Map (present)
  specs/  plans/  ideas/  tech-debt/      ← the Ledger (past)
  templates/                              ← one note template per type
  README.md                              ← the property schema (this section, expanded)
  .obsidian/                             ← minimal shared config (Obsidian-compatible; low investment)
```

Obsidian-compatible by design (YAML frontmatter = properties, `[[wikilinks]]` connect notes, `sources:`/`related:` feed the graph). We keep frontmatter + wikilinks because they cost nothing and future-proof human browsing; we do **not** over-invest in Obsidian chrome. `.gitignore` commits the shared `.obsidian` config but ignores per-user `.obsidian/workspace*.json`.

**Universal frontmatter (all note types):**

```yaml
type: zone        # zone | entity | flow | decision | spec | plan | idea | debt
summary: "1–3 sentence human glance."
tags: []
status: active    # per-type lifecycle (below)
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []       # lateral [[wikilinks]]
sources: []       # lineage [[wikilinks]]
```

**Per-type extras:**

- `zone` → `owns: { routes, anchors, globs }`, `depends: [[..]]`, `invariants: [{ rule, enforcedBy: ["[[skill:..]]","[[test:..]]"] }]`, `verifiedAt: <commit-SHA the card was last confirmed vs code; "" = unverified>`
- `entity` → `anchor: <glob|route|symbol>`, `intent: "one-line note"` (opt-in, load-bearing only)
- `flow` → `steps: ["route:<path>", "symbol:<name>", "glob:<path>", ...]`, `verify: "observable success"`, `e2e: [[file]]`
- `decision` → `decided: YYYY-MM-DD`, `supersededBy: [[id]]`
- `spec` → `origin: "<seeding prompt>"`
- `plan` → `implements: [[spec]]`, `produced: ["[[zone]]","[[decision]]"]` (filled on done)
- `idea` → `maturity: seed | budding | evergreen`
- `debt` → `severity: low|med|high|critical`, `effort: low|med|high`

**Lifecycle (makes the read-only contract explicit):**

- `spec`: draft → planned (read-only) → superseded
- `plan`: draft → executing → done (read-only) → abandoned
- `debt`: open → done (read-only) → wontfix
- `idea`: active → promoted → archived (evergreen)
- `zone`/`flow`/`entity`/`decision`: active → unmounted (TOMBSTONE in the Attic, never deleted)

## 4. Anchor strategy

This repo has **no `data-testid`** (verified: 0 occurrences). Anchors are therefore the always-greppable trio:

- **`glob:<path>`** — verified via `git ls-files -- <glob>` returns ≥1 tracked file. (HARD ERROR otherwise.)
- **`route:<path>`** — verified by locating a matching segment / `page.tsx` under `src/app/**`. (HARD ERROR otherwise.)
- **`symbol:<name>`** — verified by grepping for the exported symbol / component name in tracked files. (HARD ERROR otherwise.)

The generator (§6) verifies all anchors resolve in the actual code.

## 5. The zone map (~11 zones)

Seeded from the src/ tree + the 6 skills + the test suites. Each card gets accurate globs, a crisp summary, invariants, and `verifiedAt = HEAD` at authoring time. Exact glob boundaries are finalized when each card is authored; the set below is the agreed shape.

| Zone | Owns (primary globs) | Skill projection / sample invariant (enforcedBy) |
|---|---|---|
| **the-mind** | `scripts/mind/**`, `.claude/commands/map-sync.md` | *self — globs point at the IMPLEMENTATION, never the vault markdown, to avoid the stale-on-every-commit trap* |
| **offers-data** | `src/collections/Offers/**` | inv: schema change ⇒ idempotent migration touching both `offers` and `_offers_v` → `[[skill:eventizer-payload-migrations]]` |
| **offer-wizard** | `src/components/panel/wizard/**`, `src/actions/panel/offers.ts` | `[[skill:eventizer-offers-wizard]]`; inv: `draft` param must match `_status` |
| **offer-listing** | `src/app/(frontend)/[lang]/ogloszenia/**`, `src/blocks/OffersMap/**`, `src/blocks/FeaturedOffers/**` | inv: two-phase query hydration → `[[test:offersQueryHydration.int]]` |
| **panel** | `src/app/(frontend)/[lang]/panel/**`, `src/components/panel/**` | `[[skill:eventizer-panel-conventions]]` |
| **auth** | `src/auth/**`, `src/collections/auth/**`, `src/app/(frontend)/[lang]/auth/**`, `src/app/api/auth/**`, `src/access/**` | inv: role hierarchy admin→moderator→service-provider/client |
| **billing** | `src/actions/stripe/**`, `src/lib/stripe/**`, `src/lib/subscriptions/**`, `src/app/api/cron/purge-stripe-events/**` | inv: subscription → role transition → `[[test:stripe-webhooks.int]]`; downgrade drafts offers → `[[test:draftOffersOnDowngrade.int]]` |
| **content-blocks** | `src/blocks/**`, `src/collections/Pages/**`, `src/heros/**` | — |
| **design-system** | `src/components/ui/**`, `src/styles/**` | `[[skill:eventizer-design-tokens]]`; inv: lucide = UI chrome / react-icons fa6 = brand marks |
| **media** | `src/collections/uploads/**`, `src/app/api/offer-video/**`, `src/components/video/**`, `src/components/image-position/**` | — |
| **ai-content** | `src/app/api/generate-content/**`, `src/app/api/generate-description/**` | — |

**Cross-cutting skills that become conventions + invariants** (not their own zone; the skill stays auto-triggering): `eventizer-server-actions` (the `{ success, data | error }` return shape + the `draft` / `_status` match), `eventizer-payload-migrations` (the both-tables idempotent rule). These attach as `invariants` on the relevant zones and as decision records.

**`eventizer-architecture` is repurposed as the entry-ramp / router skill.** Its descriptive content (collections list, route structure, role hierarchy) folds into `map/index.md` + the relevant zone cards; its remaining job is "orient via the Mind index, then load companion skill X for the area you're touching."

## 6. The machinery

All scripts are plain ESM `.mjs` to match the existing `scripts/prepare-migrations.mjs` convention. The generator may freely use `child_process`/git; the SessionStart hook must not (pure `fs` reads).

### 6.1 Generator — `scripts/mind/generate.mjs`

Uses the `yaml` package (add as a devDependency if not already resolvable). Contract:

1. Read every `eventizer-mind/map/zones/*.md` (`type: zone`) and `map/flows/*.md`.
2. **Verify anchors resolve** for each zone (§4): every glob → ≥1 `git ls-files` match; every route → matching segment under `src/app/**`; every symbol → grep hit. **HARD ERROR** on any miss.
3. **Freshness:** for each zone, `git log <verifiedAt>..HEAD -- <globs>` non-empty ⇒ mark **`⚠ stale`**. Empty `verifiedAt` ⇒ stale.
4. **Invariants:** any invariant whose `enforcedBy` is empty → report as a **verification gap** (and note it as a tech-debt candidate). Soft-warn if a referenced `test:`/`skill:` target can't be located.
5. **Flows:** every flow step's anchor must resolve — **HARD ERROR** otherwise.
6. **Write `eventizer-mind/map/index.md`:** a "generated — do not hand-edit" banner, then a table (`Zone | Status | Freshness | Summary`) sorted by zone; a `## ⚠ Verification gaps` section; a `## Attic` section listing unmounted (tombstoned) zones.
7. **Exit non-zero** on any hard error so the local check gate fails loudly.

### 6.2 `pnpm mind:check`

Add to `package.json` scripts: `"mind:check": "node scripts/mind/generate.mjs"`. This is the gate (there is no CI pipeline to hook into).

### 6.3 SessionStart hook — `scripts/mind/session-status.mjs`

Pure `fs` reads, no shelling out, non-blocking. Prints e.g. `🧠 Mind: N zones · M open tech-debt — orient via eventizer-mind/map/index.md before coding.` Registered in a **new, committed `.claude/settings.json`** under `hooks.SessionStart` (the repo currently has only the git-ignored `settings.local.json`).

### 6.4 `/map-sync` command — `.claude/commands/map-sync.md`

Runs the generator and reports stale zones + verification gaps.

### 6.5 `CLAUDE.md` (repo root — does not exist today)

Lean, pointers not copies:

- **DEV RULE (highest priority):** "Orient Mind-first. Maintain on finish. Don't work blind; don't leave ghosts."
  - *Before working:* load `eventizer-mind/map/index.md` → the relevant zone card → trace its `sources`.
  - *On finish (same change as the code):* update touched zone cards; re-stamp `verifiedAt` to HEAD; add decision records for any non-obvious "why"; file tech-debt for deferrals; run `pnpm mind:check`; commit the updated `index.md`.
- **PIPELINE OVERRIDE:** brainstorming output → `eventizer-mind/specs/YYYY-MM-DD-<name>-design.md`; writing-plans output → `eventizer-mind/plans/YYYY-MM-DD-<name>-plan.md`. (Overrides the superpowers default of `docs/superpowers/*`.)
- Pointer to the `eventizer-architecture` entry-ramp skill; note that pnpm is canonical.

## 7. Ledger relocation & stale-projection cleanup

- **Relocate** `docs/superpowers/{specs,plans}` (21 files) → `eventizer-mind/{specs,plans}` via `git mv` (preserves history). Remove the now-empty `docs/superpowers/` (and `docs/` if nothing else remains). This very spec relocates with them in Phase 3.
- **Clean up the stale projections** discovered during brainstorming:
  - Delete `bun.lock` (pnpm is canonical).
  - Correct `.github/copilot-instructions.md` — its "instead of pnpm use `bun run`" rule is wrong; also point it at the Mind.
  - Replace the boilerplate `README.md` lead-in with a short, accurate description + a pointer to `eventizer-mind/map/index.md`.

## 8. First decision records to seed (the "why" that has no home today)

- `pnpm-is-canonical` — the bun-vs-pnpm drift, why pnpm wins, what was cleaned up.
- `migrate-before-next-build` — why `payload migrate` prefixes `next build` (SSG prerender races the schema).
- `wizard-dual-form-state` — why media/content live in `useState` outside react-hook-form.
- `draft-must-match-_status` — why the Payload `draft` param must mirror the saved `_status`.
- `better-auth-payload-user-sync` — why Better Auth sessions + a Payload Users collection coexist.
- `polish-url-param-names` — why list pages use `strona`/`filtr`/`q` (linked from emails + Stripe redirects).

Each links its `sources` to the originating spec/plan/commit where recoverable.

## 9. Phasing

Each phase is committed independently (honoring the always-commit rule).

1. **Scaffold** the vault: folders, one template per note type, the property-schema `README.md`, minimal `.obsidian` config, `.gitignore` rules.
2. **Build the verifier:** `scripts/mind/generate.mjs` + `scripts/mind/session-status.mjs` + `.claude/commands/map-sync.md` + `.claude/settings.json` hook + the `mind:check` script. Add `yaml` devDep if needed.
3. **Seed the Map** and **relocate the Ledger:** author the ~11 zone cards (accurate globs/anchors, `verifiedAt = HEAD`) + the self-describing `the-mind` zone (heeding the stale-trap); write the first decision records; `git mv` the existing specs/plans into the vault.
4. **Wire projections:** create `CLAUDE.md`; refactor the 6 skills into lean projections that point into their zone cards; repurpose `eventizer-architecture` as the entry-ramp; fix the stale projections (§7).
5. **Green & commit:** run `pnpm mind:check`, confirm `index.md` lists every zone with anchors resolving and no hard errors, fix anything stale, final commit.

## 10. Non-goals (YAGNI)

- **No real CI pipeline.** There is none today; we do not add GitHub Actions. The gate is `pnpm mind:check` + the SessionStart hook + the CLAUDE.md finish-rule.
- **No automated tech-debt filing.** The generator *reports* gaps and suggests; a human/agent files the debt note. (Keeps the generator pure and predictable.)
- **No heavy Obsidian investment.** Frontmatter + wikilinks only; no plugins, no custom graph styling.
- **No mass refactor of working code.** The Mind documents and verifies; it does not rewrite zones. The only code touched is the generator/hook scripts and the stale-projection cleanup.

## 11. Done criteria (self-check before declaring complete)

- [ ] `pnpm mind:check` runs green and exits non-zero on a deliberately broken anchor.
- [ ] `eventizer-mind/map/index.md` lists every real zone; every zone's anchors resolve in code.
- [ ] The self-describing `the-mind` zone is **not** perpetually stale (it owns its scripts, not the vault markdown).
- [ ] `CLAUDE.md` carries the Mind-first dev rule + the pipeline override.
- [ ] The SessionStart hook prints the status line on a fresh session.
- [ ] No copies: skills / CLAUDE.md point **into** the Mind; they don't restate it.
- [ ] Map (present) and Ledger (past) are never conflated; tombstone over delete, supersede over edit.
- [ ] Stale projections cleaned: `bun.lock` gone, copilot-instructions corrected, README points to the Mind.
- [ ] The existing 21 specs/plans live under `eventizer-mind/` with git history preserved.
