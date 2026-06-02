# Eventizer Mind

The single source of truth for understanding Eventizer. Everything in `.claude/`
(CLAUDE.md, skills, the generator, the SessionStart hook) is a **projection** of
this vault or a **pointer** into it — never a copy.

## Two kinds of knowledge, never conflated

| THE MAP (`map/`) | THE LEDGER (`specs/ plans/ ideas/ tech-debt/`) |
| --- | --- |
| tense: PRESENT — what IS | tense: PAST — how/why we decided & built it |
| mutable: tracks the code | read-only once consumed (supersede, don't edit) |
| answers: what / where / how now | answers: why / what we intended |

Lineage joins them: **prompt → idea → spec → plan → zone card / decision**, via
the `sources:` (provenance) and `related:` (lateral) link properties.

## Resolution ladder — read the cheapest note that answers the question

- `map/overview.md` — the **product overview**: what Eventizer is, who it serves, why. Read this first.
- `map/index.md` — generated TOC: every zone, its status, freshness, essence.
- `map/zones/<slug>.md` — the hinge: purpose, anchors, invariants, lineage, `verifiedAt`.
- the code itself (+ optional `type: entity` intent notes on load-bearing parts).
- `map/decisions/` — ADRs: context, decision, why, supersedes.

## Property schema

Every note carries universal frontmatter: `type`, `summary`, `tags`, `status`,
`created`, `updated`, `related` (lateral `[[wikilinks]]`), `sources` (lineage `[[wikilinks]]`).

Per-type extras:
- **zone** → `owns: {routes, anchors, globs}`, `depends`, `invariants: [{rule, enforcedBy}]`, `verifiedAt` (commit SHA the card was last confirmed against code; `""` = unverified ⇒ stale).
- **entity** → `anchor`, `intent`.
- **flow** → `steps` (anchors), `verify`, `e2e`.
- **decision** → `decided`, `supersededBy`.
- **spec** → `origin`.
- **plan** → `implements`, `produced`.
- **idea** → `maturity: seed|budding|evergreen`.
- **debt** → `severity`, `effort`.
- **product** → (no extra fields) — present-tense product/domain narrative: the abstract "what & why" (vision, values, model, voice). Lives in `map/` root; not anchor-verified by the generator.

Anchors are `glob:<path>`, `route:<path>`, or `symbol:<name>` (this repo has no
`data-testid`). The generator verifies they resolve in tracked code.

## Lifecycle

- spec: draft → planned → superseded
- plan: draft → executing → done → abandoned
- debt: open → done → wontfix
- idea: active → promoted → archived
- zone/flow/entity/decision: active → unmounted (tombstone in the Attic, never deleted)

## Maintaining it

`pnpm mind:check` (or `/map-sync`) regenerates + validates `map/index.md` and exits
non-zero on any unresolved anchor. See the root `CLAUDE.md` for the Mind-first dev rule.
