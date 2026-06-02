# Eventizer Mind Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up "the Mind" — an Obsidian-compatible vault that is the single source of truth for Eventizer's Map (what/where is now) and Ledger (why/how), with a verifying generator, a SessionStart hook, and the 6 existing skills refactored into lean auto-triggering projections that point into it.

**Architecture:** `eventizer-mind/` holds `map/{zones,decisions,flows,entities}` (present) + `specs/plans/ideas/tech-debt` (past). A plain-ESM generator (`scripts/mind/generate.mjs`) parses zone/flow frontmatter, verifies every glob/route/symbol anchor resolves against tracked code (hard error otherwise), computes per-zone freshness against a `verifiedAt` commit SHA, flags invariants lacking `enforcedBy`, and rewrites `map/index.md`. `CLAUDE.md`, the skills, the `/map-sync` command, and the SessionStart hook are projections — pointers, never copies.

**Tech Stack:** Node ESM `.mjs` (matching `scripts/prepare-migrations.mjs`), `js-yaml` (frontmatter parsing, pinned as devDep), `git` via `child_process`, vitest (`tests/int`) for the generator lib, pnpm (canonical), Claude Code hooks/commands.

**Spec:** `docs/superpowers/specs/2026-06-02-eventizer-mind-design.md` (relocates to `eventizer-mind/specs/` in Task 11).

**Conventions for every task:** commit at the end of each task (honors the always-commit rule). The repo is on branch `feat/eventizer-mind`. Use `node scripts/mind/generate.mjs` directly while iterating; `pnpm mind:check` once the script exists.

---

## PHASE 1 — Scaffold the vault

### Task 1: Create the vault skeleton + gitignore rule

**Files:**
- Create: `eventizer-mind/map/zones/.gitkeep`, `eventizer-mind/map/decisions/.gitkeep`, `eventizer-mind/map/flows/.gitkeep`, `eventizer-mind/map/entities/.gitkeep`
- Create: `eventizer-mind/specs/.gitkeep`, `eventizer-mind/plans/.gitkeep`, `eventizer-mind/ideas/.gitkeep`, `eventizer-mind/tech-debt/.gitkeep`
- Create: `eventizer-mind/templates/.gitkeep`
- Create: `eventizer-mind/.obsidian/app.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create the directory tree with placeholders**

Run:
```bash
cd /Users/muslewski/Documents/Repozytoria/eventizer
mkdir -p eventizer-mind/map/{zones,decisions,flows,entities} \
         eventizer-mind/{specs,plans,ideas,tech-debt,templates} \
         eventizer-mind/.obsidian
for d in map/zones map/decisions map/flows map/entities specs plans ideas tech-debt templates; do
  touch "eventizer-mind/$d/.gitkeep"
done
```

- [ ] **Step 2: Add a minimal shared Obsidian config**

Create `eventizer-mind/.obsidian/app.json`:
```json
{
  "alwaysUpdateLinks": true,
  "newLinkFormat": "shortest",
  "useMarkdownLinks": false
}
```

- [ ] **Step 3: Add the gitignore rule for per-user Obsidian state**

Append to `.gitignore`:
```gitignore

# Obsidian per-user workspace state (commit shared .obsidian config, ignore workspace)
eventizer-mind/.obsidian/workspace*.json
eventizer-mind/.obsidian/cache
```

- [ ] **Step 4: Verify the tree exists**

Run: `find eventizer-mind -type d | sort`
Expected: lists `eventizer-mind`, `.../map`, `.../map/zones`, `.../map/decisions`, `.../map/flows`, `.../map/entities`, `.../specs`, `.../plans`, `.../ideas`, `.../tech-debt`, `.../templates`, `.../.obsidian`.

- [ ] **Step 5: Commit**

```bash
git add eventizer-mind .gitignore
git commit -m "feat(mind): scaffold the vault directory tree + obsidian config"
```

### Task 2: Write the note templates + the property-schema README

**Files:**
- Create: `eventizer-mind/templates/{zone,entity,flow,decision,spec,plan,idea,debt}.md`
- Create: `eventizer-mind/README.md`

- [ ] **Step 1: Create `eventizer-mind/templates/zone.md`**

```markdown
---
type: zone
summary: ""
tags: []
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
sources: []
owns:
  routes: []
  anchors: []
  globs: []
depends: []
invariants: []
verifiedAt: ""
---

# <Zone Name>

## Purpose
<what this zone is and does, 1–2 sentences>

## Anchors
<the load-bearing files / symbols, one line each>

## Invariants
<the rules that must hold; mirror the frontmatter `invariants` in prose>
```

- [ ] **Step 2: Create `eventizer-mind/templates/entity.md`**

```markdown
---
type: entity
summary: ""
tags: []
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
sources: []
anchor: ""
intent: ""
---

# <Entity Name>

<one-paragraph idea-way note on this load-bearing part>
```

- [ ] **Step 3: Create `eventizer-mind/templates/flow.md`**

```markdown
---
type: flow
summary: ""
tags: []
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
sources: []
steps: []
verify: ""
e2e: []
---

# <Flow Name>

## Steps
<numbered walkthrough; each maps to a `steps` anchor>

## Verify
<the observable success condition>
```

- [ ] **Step 4: Create `eventizer-mind/templates/decision.md`**

```markdown
---
type: decision
summary: ""
tags: []
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
sources: []
decided: YYYY-MM-DD
supersededBy: ""
---

# <Decision Title>

## Context
<the forces / problem>

## Decision
<what we decided>

## Why
<the reasoning, trade-offs, what we rejected>

## Consequences
<what this commits us to>
```

- [ ] **Step 5: Create `eventizer-mind/templates/spec.md`**

```markdown
---
type: spec
summary: ""
tags: []
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
sources: []
origin: ""
---

# <Spec Title>

## Context & motivation

## Design

## Non-goals
```

- [ ] **Step 6: Create `eventizer-mind/templates/plan.md`**

```markdown
---
type: plan
summary: ""
tags: []
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
sources: []
implements: []
produced: []
---

# <Plan Title>

<tasks; see superpowers writing-plans format>
```

- [ ] **Step 7: Create `eventizer-mind/templates/idea.md`**

```markdown
---
type: idea
summary: ""
tags: []
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
sources: []
maturity: seed
---

# <Idea Title>

<the idea, why it might matter>
```

- [ ] **Step 8: Create `eventizer-mind/templates/debt.md`**

```markdown
---
type: debt
summary: ""
tags: []
status: open
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
sources: []
severity: med
effort: med
---

# <Debt Title>

## What
<the shortcut / gap>

## Risk
<what it costs us if left>

## Fix sketch
<how to pay it down>
```

- [ ] **Step 9: Create `eventizer-mind/README.md`** (the property schema + how to read the vault)

```markdown
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
```

- [ ] **Step 10: Commit**

```bash
git add eventizer-mind/templates eventizer-mind/README.md
git commit -m "feat(mind): note templates (one per type) + property-schema README"
```

---

## PHASE 2 — Build the verifier

### Task 3: Pin js-yaml, add the `mind:check` script, and build the generator lib (TDD)

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Create: `scripts/mind/lib.mjs`
- Test: `tests/int/mind/generator.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/mind/generator.int.spec.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  globToRegex,
  matchGlob,
  grepCode,
  routeExists,
  trackedFiles,
} from '../../../scripts/mind/lib.mjs'

describe('mind generator lib', () => {
  it('globToRegex matches ** across path segments but not siblings', () => {
    expect(globToRegex('src/**').test('src/a/b/c.ts')).toBe(true)
    expect(globToRegex('src/**').test('other/a.ts')).toBe(false)
    expect(globToRegex('src/app/(frontend)/[lang]/panel/**').test('src/app/(frontend)/[lang]/panel/oferty/page.tsx')).toBe(true)
  })

  it('trackedFiles returns a non-empty list', () => {
    expect(trackedFiles().length).toBeGreaterThan(0)
  })

  it('matchGlob resolves a real zone glob and rejects a fake one', () => {
    expect(matchGlob('src/collections/Offers/**').length).toBeGreaterThan(0)
    expect(matchGlob('src/does-not-exist/**').length).toBe(0)
  })

  it('grepCode finds a known exported symbol', () => {
    expect(grepCode('OfferWizardForm').length).toBeGreaterThan(0)
  })

  it('routeExists finds a real route', () => {
    expect(routeExists('/panel')).toBe(true)
    expect(routeExists('/no-such-route')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/int/mind/generator.int.spec.ts`
Expected: FAIL — cannot resolve `../../../scripts/mind/lib.mjs` (module does not exist yet).

- [ ] **Step 3: Pin js-yaml and add the script**

Run: `pnpm add -D js-yaml`
Then add to `package.json` `scripts` (after `"lint": "eslint ."`):
```json
    "mind:check": "node scripts/mind/generate.mjs",
```

- [ ] **Step 4: Implement `scripts/mind/lib.mjs`**

```js
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function sh(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

let _tracked = null
export function trackedFiles() {
  if (_tracked) return _tracked
  const out = sh('git ls-files')
  _tracked = out ? out.split('\n').filter(Boolean) : []
  return _tracked
}

// glob → RegExp. ** matches across path segments; * matches within one segment.
// All other glob chars (including ( ) [ ]) are treated as literals.
export function globToRegex(glob) {
  let re = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  re = re.replace(/\*\*/g, ' ').replace(/\*/g, '[^/]*').replace(/ /g, '.*')
  return new RegExp('^' + re + '$')
}

export function matchGlob(glob) {
  const rx = globToRegex(glob)
  return trackedFiles().filter((f) => rx.test(f))
}

export function grepCode(symbol) {
  const out = sh(`git grep -lF -- ${JSON.stringify(symbol)}`)
  return out ? out.split('\n').filter(Boolean) : []
}

export function routeExists(route) {
  const seg = route.replace(/^\/+/, '')
  const last = seg.split('/').filter(Boolean).pop() || ''
  return trackedFiles().some(
    (f) => f.startsWith('src/app/') && (f.includes(`/${last}/`) || f.includes(`[lang]/${seg}`)),
  )
}

let _changed
export function changedFilesSince(sha) {
  if (!sha) return null // unverified ⇒ caller treats as stale
  if (_changed && _changed.sha === sha) return _changed.files
  const out = sh(`git diff --name-only ${sha} HEAD`)
  const files = out ? out.split('\n').filter(Boolean) : []
  _changed = { sha, files }
  return files
}

export function parseNote(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { frontmatter: {}, body: raw, file: filePath }
  // js-yaml v4 `load` uses DEFAULT_SCHEMA — it does NOT construct arbitrary JS
  // types (no `!!js/function` etc.), so it is the safe parser. Frontmatter is
  // trusted in-repo content regardless.
  return { frontmatter: yaml.load(m[1]) || {}, body: m[2], file: filePath }
}

export function listNotes(relDir) {
  const abs = path.join(ROOT, relDir)
  if (!existsSync(abs)) return []
  return readdirSync(abs)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .sort()
    .map((f) => parseNote(path.join(abs, f)))
}

export function headSha() {
  return sh('git rev-parse HEAD')
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/int/mind/generator.int.spec.ts`
Expected: PASS — all 5 assertions green.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/mind/lib.mjs tests/int/mind/generator.int.spec.ts
git commit -m "feat(mind): generator lib (glob/route/symbol anchor resolution) + tests"
```

### Task 4: Build the generator + index writer

**Files:**
- Create: `scripts/mind/generate.mjs`
- Test: extend `tests/int/mind/generator.int.spec.ts`

- [ ] **Step 1: Write the failing test (append to the existing spec file)**

Append this block inside `tests/int/mind/generator.int.spec.ts` (after the existing `describe`):
```ts
import { run } from '../../../scripts/mind/generate.mjs'

describe('mind generator run()', () => {
  it('returns the result shape and does not throw on the current vault', () => {
    const result = run()
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.gaps)).toBe(true)
    expect(Array.isArray(result.rows)).toBe(true)
    expect(Array.isArray(result.attic)).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run tests/int/mind/generator.int.spec.ts`
Expected: FAIL — cannot resolve `../../../scripts/mind/generate.mjs`.

- [ ] **Step 3: Implement `scripts/mind/generate.mjs`**

```js
import { writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import {
  ROOT,
  listNotes,
  matchGlob,
  grepCode,
  routeExists,
  changedFilesSince,
  globToRegex,
  trackedFiles,
} from './lib.mjs'

const ZONES_DIR = 'eventizer-mind/map/zones'
const FLOWS_DIR = 'eventizer-mind/map/flows'
const INDEX_FILE = path.join(ROOT, 'eventizer-mind/map/index.md')

function resolveAnchor(anchor) {
  const i = anchor.indexOf(':')
  const kind = anchor.slice(0, i)
  const val = anchor.slice(i + 1)
  if (kind === 'glob') return matchGlob(val).length > 0
  if (kind === 'route') return routeExists(val)
  if (kind === 'symbol') return grepCode(val).length > 0
  return false
}

// soft-check that an enforcedBy ref points at something real
function enforcedByResolves(ref) {
  const clean = String(ref).replace(/^\[\[/, '').replace(/\]\]$/, '')
  if (clean.startsWith('test:')) {
    const key = clean.slice(5)
    return trackedFiles().some((f) => f.startsWith('tests/') && f.includes(key))
  }
  if (clean.startsWith('skill:')) {
    return existsSync(path.join(ROOT, '.claude/skills', clean.slice(6)))
  }
  return true
}

export function run() {
  const errors = []
  const gaps = []
  const warnings = []
  const rows = []
  const attic = []

  const zones = listNotes(ZONES_DIR).filter((n) => n.frontmatter.type === 'zone')
  const flows = listNotes(FLOWS_DIR).filter((n) => n.frontmatter.type === 'flow')

  for (const z of zones) {
    const fm = z.frontmatter
    const name = path.basename(z.file, '.md')
    if (fm.status === 'unmounted') {
      attic.push({ name, summary: fm.summary || '' })
      continue
    }
    const owns = fm.owns || {}
    const globs = owns.globs || []
    const anchors = owns.anchors || []
    const routes = owns.routes || []

    for (const g of globs) {
      if (matchGlob(g).length === 0) errors.push(`[${name}] glob matches no tracked file: ${g}`)
    }
    for (const a of anchors) {
      if (!resolveAnchor(a)) errors.push(`[${name}] anchor does not resolve: ${a}`)
    }
    for (const r of routes) {
      if (!routeExists(r)) errors.push(`[${name}] route not found: ${r}`)
    }

    const changed = changedFilesSince(fm.verifiedAt)
    let fresh = '✅ fresh'
    if (changed === null) {
      fresh = '⚠ stale (unverified)'
    } else {
      const rxs = globs.map(globToRegex)
      if (changed.some((f) => rxs.some((rx) => rx.test(f)))) fresh = '⚠ stale'
    }

    for (const inv of fm.invariants || []) {
      const eb = inv.enforcedBy || []
      if (eb.length === 0) {
        gaps.push(`[${name}] invariant has no enforcedBy: "${inv.rule}"`)
      } else {
        for (const ref of eb) {
          if (!enforcedByResolves(ref)) warnings.push(`[${name}] enforcedBy ref not found: ${ref}`)
        }
      }
    }

    rows.push({
      name,
      status: fm.status || 'active',
      fresh,
      summary: (fm.summary || '').replace(/\s+/g, ' ').trim(),
    })
  }

  for (const fl of flows) {
    const name = path.basename(fl.file, '.md')
    for (const step of fl.frontmatter.steps || []) {
      if (!resolveAnchor(step)) errors.push(`[flow:${name}] step anchor does not resolve: ${step}`)
    }
  }

  if (existsSync(path.dirname(INDEX_FILE))) {
    writeFileSync(INDEX_FILE, renderIndex(rows, gaps, attic))
  }

  for (const w of warnings) console.warn('WARN: ' + w)
  for (const g of gaps) console.warn('GAP:  ' + g)
  for (const e of errors) console.error('ERROR: ' + e)
  console.log(`\n🧠 mind:check — ${rows.length} zones · ${gaps.length} gaps · ${errors.length} errors`)

  return { errors, gaps, warnings, rows, attic }
}

function renderIndex(rows, gaps, attic) {
  rows.sort((a, b) => a.name.localeCompare(b.name))
  const out = []
  out.push('<!-- GENERATED by scripts/mind/generate.mjs — DO NOT HAND-EDIT. Run `pnpm mind:check`. -->')
  out.push('')
  out.push('# Eventizer Mind — Zone Index')
  out.push('')
  out.push('| Zone | Status | Freshness | Summary |')
  out.push('| --- | --- | --- | --- |')
  for (const r of rows) out.push(`| [[${r.name}]] | ${r.status} | ${r.fresh} | ${r.summary} |`)
  out.push('')
  out.push('## ⚠ Verification gaps')
  out.push('')
  out.push(gaps.length ? gaps.map((g) => `- ${g}`).join('\n') : '_None._')
  out.push('')
  out.push('## Attic (unmounted)')
  out.push('')
  out.push(attic.length ? attic.map((a) => `- [[${a.name}]] — ${a.summary}`).join('\n') : '_Empty._')
  out.push('')
  return out.join('\n')
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith(path.join('mind', 'generate.mjs'))
if (invokedDirectly) {
  const { errors } = run()
  if (errors.length > 0) process.exit(1)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/int/mind/generator.int.spec.ts`
Expected: PASS. (With no zone cards yet, `run()` returns empty arrays and writes a near-empty `index.md`.)

- [ ] **Step 5: Run the generator directly to confirm the CLI path works**

Run: `pnpm mind:check`
Expected: prints `🧠 mind:check — 0 zones · 0 gaps · 0 errors` and exits 0; `eventizer-mind/map/index.md` now exists with the generated banner.

- [ ] **Step 6: Commit**

```bash
git add scripts/mind/generate.mjs tests/int/mind/generator.int.spec.ts eventizer-mind/map/index.md
git commit -m "feat(mind): verifying generator + index writer (mind:check)"
```

### Task 5: SessionStart status hook script

**Files:**
- Create: `scripts/mind/session-status.mjs`

- [ ] **Step 1: Implement the hook script (pure fs, no exec)**

```js
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const zonesDir = path.join(root, 'eventizer-mind/map/zones')
const debtDir = path.join(root, 'eventizer-mind/tech-debt')

function countMd(dir, predicate) {
  if (!existsSync(dir)) return 0
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .filter((f) => (predicate ? predicate(readFileSync(path.join(dir, f), 'utf8')) : true)).length
}

const zones = countMd(zonesDir)
const openDebt = countMd(debtDir, (c) => /\bstatus:\s*open\b/.test(c))
console.log(
  `🧠 Mind: ${zones} zones · ${openDebt} open tech-debt — orient via eventizer-mind/map/index.md before coding.`,
)
```

- [ ] **Step 2: Run it to confirm output**

Run: `node scripts/mind/session-status.mjs`
Expected: prints `🧠 Mind: 0 zones · 0 open tech-debt — orient via eventizer-mind/map/index.md before coding.` (counts are 0 until Phase 3) and exits 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/mind/session-status.mjs
git commit -m "feat(mind): SessionStart status hook script"
```

### Task 6: Register the hook + add the /map-sync command

**Files:**
- Create: `.claude/settings.json`
- Create: `.claude/commands/map-sync.md`

- [ ] **Step 1: Create `.claude/settings.json`** (committed, shared — distinct from the git-ignored `settings.local.json`)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "node scripts/mind/session-status.mjs" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Create `.claude/commands/map-sync.md`**

```markdown
---
description: Rebuild and validate the Mind index — report stale zones and verification gaps
allowed-tools: Bash(pnpm mind:check), Bash(node scripts/mind/generate.mjs)
---

Run `pnpm mind:check`, then report to the user:

1. If it exited non-zero, list every `ERROR:` line (unresolved anchors / broken flow steps). These block — they must be fixed.
2. From the regenerated `eventizer-mind/map/index.md`, list every `⚠ stale` zone and, for each, what changed under its globs since its `verifiedAt` SHA.
3. List every `GAP:` line (invariants with no `enforcedBy`) and offer to file a `tech-debt` note for each.
4. List any `WARN:` line (an `enforcedBy` ref that no longer resolves).
5. Confirm `eventizer-mind/map/index.md` was rewritten.
```

- [ ] **Step 3: Verify the command file is valid markdown with frontmatter**

Run: `head -3 .claude/commands/map-sync.md`
Expected: shows the `---` frontmatter opening and the `description:` line.

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.json .claude/commands/map-sync.md
git commit -m "feat(mind): register SessionStart hook + /map-sync command"
```

---

## PHASE 3 — Seed the map + relocate the ledger

> For every zone card: set `verifiedAt` by running `git rev-parse HEAD` and pasting the SHA. The `created`/`updated` dates are `2026-06-02`. Bodies are authored by **compressing the named source skill** — move the *descriptive what/where* content into the card; the *procedural how-to* stays in the skill (refactored in Phase 4). Keep each card body to three short sections: Purpose, Anchors, Invariants.

### Task 7: Author the self-describing `the-mind` zone card

**Files:**
- Create: `eventizer-mind/map/zones/the-mind.md`

- [ ] **Step 1: Capture the current HEAD SHA**

Run: `git rev-parse HEAD`
Use the output as `<HEAD_SHA>` below.

- [ ] **Step 2: Create the card** (note the CRITICAL gotcha — globs point at the *implementation*, never the vault markdown, so it isn't stale on every doc edit)

```markdown
---
type: zone
summary: "The repository knowledge system itself: an Obsidian-compatible vault (Map + Ledger) plus a verifying generator and a SessionStart hook. Projections in .claude/ point into it, never copy it."
tags: [meta, the-mind]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[pnpm-is-canonical]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: []
  anchors: ["symbol:run", "symbol:globToRegex"]
  globs:
    - "scripts/mind/**"
    - ".claude/commands/map-sync.md"
depends: []
invariants:
  - rule: "the-mind's globs point at the generator/hook implementation, never the vault markdown (else it shows stale on every documentation edit)."
    enforcedBy: ["[[test:generator.int]]"]
  - rule: "mind:check exits non-zero on any unresolved anchor or broken flow step."
    enforcedBy: ["[[test:generator.int]]"]
verifiedAt: "<HEAD_SHA>"
---

# The Mind

## Purpose
The agent-native knowledge base for Eventizer. The vault (`eventizer-mind/`) is the single
source of truth; `CLAUDE.md`, the six `eventizer-*` skills, the `/map-sync` command, and the
SessionStart hook are projections into it. The generator keeps the Map honest against the code.

## Anchors
- `scripts/mind/lib.mjs` — anchor resolution (glob/route/symbol), git helpers, frontmatter parsing.
- `scripts/mind/generate.mjs` — `run()` verifies anchors + freshness + invariants, writes `map/index.md`, exits non-zero on hard errors.
- `scripts/mind/session-status.mjs` — pure-fs SessionStart line.
- `.claude/commands/map-sync.md` — the rebuild/validate command.

## Invariants
- Globs here name the implementation files, not the markdown they generate.
- A broken anchor fails `pnpm mind:check` loudly (the local gate, since there is no CI).
```

- [ ] **Step 3: Regenerate and confirm the-mind resolves green**

Run: `pnpm mind:check`
Expected: `🧠 mind:check — 1 zones · 0 gaps · 0 errors`, exit 0; `index.md` lists `the-mind` as `✅ fresh`.

- [ ] **Step 4: Commit**

```bash
git add eventizer-mind/map/zones/the-mind.md eventizer-mind/map/index.md
git commit -m "feat(mind): seed the self-describing the-mind zone card"
```

### Task 8: Author the 10 code zone cards

**Files (create each):**
- `eventizer-mind/map/zones/offers-data.md`
- `eventizer-mind/map/zones/offer-wizard.md`
- `eventizer-mind/map/zones/offer-listing.md`
- `eventizer-mind/map/zones/panel.md`
- `eventizer-mind/map/zones/auth.md`
- `eventizer-mind/map/zones/billing.md`
- `eventizer-mind/map/zones/content-blocks.md`
- `eventizer-mind/map/zones/design-system.md`
- `eventizer-mind/map/zones/media.md`
- `eventizer-mind/map/zones/ai-content.md`

- [ ] **Step 1: Re-capture HEAD** — `git rev-parse HEAD` → `<HEAD_SHA>` for the `verifiedAt` of every card below.

- [ ] **Step 2: Author each card** using the exact frontmatter below (these fields are verified to resolve against tracked code) + a 3-section body compressed from the named source skill. Each carries `type: zone`, `status: active`, `created/updated: 2026-06-02`, `verifiedAt: "<HEAD_SHA>"`.

**`offers-data.md`** — source: `eventizer-payload-migrations` (data-model half) + Offers collection.
```yaml
summary: "The Offers collection: data model, hooks (category resolution, cache revalidation), access rules, drafts/versions."
owns:
  routes: []
  anchors: ["symbol:populateCategoryData", "symbol:resolveCategory"]
  globs: ["src/collections/Offers/**"]
depends: ["[[media]]", "[[billing]]"]
invariants:
  - rule: "Any Offers field change ships an idempotent migration touching BOTH `offers` and `_offers_v` (version_<field>)."
    enforcedBy: ["[[skill:eventizer-payload-migrations]]"]
related: ["[[migrate-before-next-build]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

**`offer-wizard.md`** — source: `eventizer-offers-wizard`.
```yaml
summary: "The 6-step create/edit offer wizard and its server actions: dual form state (RHF + useState), step-gated validation, publish vs draft."
owns:
  routes: ["/panel/oferty/nowa"]
  anchors: ["symbol:OfferWizardForm"]
  globs: ["src/components/panel/wizard/**", "src/actions/panel/offers.ts"]
depends: ["[[offers-data]]", "[[ai-content]]", "[[design-system]]"]
invariants:
  - rule: "createOffer/updateOffer pass `draft` matching `_status` (draft = _status==='draft' || !_status)."
    enforcedBy: ["[[skill:eventizer-offers-wizard]]", "[[skill:eventizer-server-actions]]"]
related: ["[[wizard-dual-form-state]]", "[[draft-must-match-status]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

**`offer-listing.md`** — source: ogloszenia routes + `2026-05-26-event-types` history.
```yaml
summary: "Public offer browsing: ogloszenia list/hero views, search + filters (Polish params), category & event-type strips, offers map, featured carousel."
owns:
  routes: ["/ogloszenia"]
  anchors: []
  globs:
    - "src/app/(frontend)/[lang]/ogloszenia/**"
    - "src/blocks/OffersMap/**"
    - "src/blocks/FeaturedOffers/**"
depends: ["[[offers-data]]", "[[design-system]]"]
invariants:
  - rule: "The two-phase fetch (filter-then-hydrate) for in-memory sort/geo paths preserves correct result hydration."
    enforcedBy: ["[[test:offersQueryHydration.int]]"]
related: ["[[polish-url-param-names]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

**`panel.md`** — source: `eventizer-panel-conventions`.
```yaml
summary: "The authenticated provider/client dashboard: PanelShell + sidebar, per-page auth+role guards, PanelPageHeader, AnimatedCard grids, Polish route segments."
owns:
  routes: ["/panel"]
  anchors: ["symbol:PanelPageHeader", "symbol:AnimatedCard"]
  globs: ["src/app/(frontend)/[lang]/panel/**", "src/components/panel/**"]
depends: ["[[auth]]", "[[design-system]]"]
invariants:
  - rule: "Every panel page re-checks the session + loads the Payload user + applies its role redirect (never trusts a stale session)."
    enforcedBy: ["[[skill:eventizer-panel-conventions]]"]
related: ["[[polish-url-param-names]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

**`auth.md`** — source: `eventizer-architecture` (auth section) + Better Auth skills.
```yaml
summary: "Better Auth (OAuth + email/password) sessions synced to a Payload Users collection; role hierarchy and access-control factories."
owns:
  routes: ["/auth"]
  anchors: ["symbol:roleOrHigher"]
  globs:
    - "src/auth/**"
    - "src/collections/auth/**"
    - "src/app/(frontend)/[lang]/auth/**"
    - "src/app/api/auth/**"
    - "src/access/**"
depends: []
invariants:
  - rule: "Role hierarchy admin → moderator → service-provider/client is enforced via roleOrHigher / *OrSelf access factories."
    enforcedBy: ["[[skill:eventizer-server-actions]]"]
related: ["[[better-auth-payload-user-sync]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

**`billing.md`** — source: `2026-04-30-multi-agency-billing` + `2026-05-11-subscription-plan-change-wizard` specs.
```yaml
summary: "Stripe subscriptions: plan sync, customer portal, webhook-driven role transitions, plan-change wizard, downgrade drafting, event purge cron."
owns:
  routes: []
  anchors: []
  globs:
    - "src/actions/stripe/**"
    - "src/lib/stripe/**"
    - "src/lib/subscriptions/**"
    - "src/app/api/cron/purge-stripe-events/**"
depends: ["[[auth]]", "[[offers-data]]"]
invariants:
  - rule: "Subscription lifecycle events drive client ↔ service-provider role transitions."
    enforcedBy: ["[[test:stripe-webhooks.int]]"]
  - rule: "Plan downgrade drafts offers beyond the new plan's limit/category access."
    enforcedBy: ["[[test:draftOffersOnDowngrade.int]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

**`content-blocks.md`** — source: blocks + Pages + heros tree.
```yaml
summary: "CMS-driven page composition: Payload Pages collection, the block library (Hero, CTA, FeaturedOffers, HowItWorks, etc.), and hero variants."
owns:
  routes: ["/[slug]"]
  anchors: []
  globs: ["src/blocks/**", "src/collections/Pages/**", "src/heros/**"]
depends: ["[[design-system]]", "[[media]]"]
invariants: []
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

**`design-system.md`** — source: `eventizer-design-tokens`.
```yaml
summary: "The visual system: shadcn/ui (new-york, stone base) primitives + the stone/brand SCSS token palette, fonts, motion baseline, icon split."
owns:
  routes: []
  anchors: ["symbol:Field"]
  globs: ["src/components/ui/**", "src/styles/**"]
depends: []
invariants:
  - rule: "lucide-react for UI chrome; react-icons/fa6 for brand marks only — never mixed."
    enforcedBy: ["[[skill:eventizer-design-tokens]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

**`media.md`** — source: uploads collections + video/image-position trees + `2026-04-23-image-position-editor`, `2026-03-23-video-aspect-ratio`.
```yaml
summary: "Media handling: Payload upload collections on Vercel Blob, offer video processing/streaming, and the image-position (focal point) editor."
owns:
  routes: []
  anchors: []
  globs:
    - "src/collections/uploads/**"
    - "src/app/api/offer-video/**"
    - "src/components/video/**"
    - "src/components/image-position/**"
depends: []
invariants:
  - rule: "Image position-style computation stays identical across server render and client editor."
    enforcedBy: ["[[test:position-styles.int]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

**`ai-content.md`** — source: generate-content / generate-description API routes (AI SDK + OpenAI).
```yaml
summary: "AI-assisted authoring: the generate-content and generate-description API routes that feed the offer wizard (AI SDK + @ai-sdk/openai)."
owns:
  routes: []
  anchors: []
  globs: ["src/app/api/generate-content/**", "src/app/api/generate-description/**"]
depends: ["[[offer-wizard]]"]
invariants: []
sources: ["[[2026-06-02-eventizer-mind-design]]"]
```

- [ ] **Step 3: Regenerate and confirm all 11 zones resolve green**

Run: `pnpm mind:check`
Expected: `🧠 mind:check — 11 zones · 0 gaps · 0 errors`, exit 0. If any `ERROR:` prints, the glob/anchor is wrong — fix the card's frontmatter (do not weaken the generator). If a `WARN:` prints, an `enforcedBy` ref is misspelled — fix it.

- [ ] **Step 4: Commit**

```bash
git add eventizer-mind/map/zones eventizer-mind/map/index.md
git commit -m "feat(mind): seed the 10 code zone cards (verifiedAt=HEAD)"
```

### Task 9: Author the 6 decision records

**Files (create each):**
- `eventizer-mind/map/decisions/pnpm-is-canonical.md`
- `eventizer-mind/map/decisions/migrate-before-next-build.md`
- `eventizer-mind/map/decisions/wizard-dual-form-state.md`
- `eventizer-mind/map/decisions/draft-must-match-status.md`
- `eventizer-mind/map/decisions/better-auth-payload-user-sync.md`
- `eventizer-mind/map/decisions/polish-url-param-names.md`

- [ ] **Step 1: Create `pnpm-is-canonical.md` (full content — the bun drift this build resolves)**

```markdown
---
type: decision
summary: "pnpm is the canonical package manager for Eventizer; bun.lock and the copilot 'use bun' rule were stale drift, removed."
tags: [tooling]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[the-mind]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
decided: 2026-06-02
supersededBy: ""
---

# pnpm is the canonical package manager

## Context
The repo carried conflicting signals: every `package.json` script calls pnpm internally
(`pnpm run test:int`, `pnpm exec playwright`) and all six skills used pnpm, yet a `bun.lock`
existed alongside `pnpm-lock.yaml` and `.github/copilot-instructions.md` instructed "instead
of pnpm use `bun run`."

## Decision
pnpm is canonical. `bun.lock` was deleted; the copilot instruction was corrected to pnpm.

## Why
The working scripts, lockfile in active use, and skills all assume pnpm; Vercel builds run the
pnpm-defined `build` script. Keeping a second lockfile invites divergent dependency trees.

## Consequences
The generator, `pnpm mind:check`, the SessionStart hook command, and all docs use pnpm. If bun
is ever reintroduced for a specific purpose, supersede this record rather than editing it.
```

- [ ] **Step 2: Create the remaining five** with the same frontmatter shape (`type: decision`, `decided: 2026-06-02`, link `sources`/`related` to the relevant zone). Each body fills Context / Decision / Why / Consequences from the named source — these are the exact points to capture:

  - **`migrate-before-next-build.md`** (source: `eventizer-payload-migrations`; related `[[offers-data]]`). Context: Next SSG prerenders pages before Payload initializes, so a DB schema behind the TS config makes Drizzle SELECT a missing column and fail the build (commonly `/pl`). Decision: the `build` script prefixes `payload migrate` before `next build`. Why: prod migrations must apply ahead of prerender; dev uses auto-push so needs none. Consequences: every field change needs an idempotent migration touching both `offers` and `_offers_v`.

  - **`wizard-dual-form-state.md`** (source: `eventizer-offers-wizard`; related `[[offer-wizard]]`). Context: media (`mainImage`, gallery, video, background) and Lexical `content` don't fit cleanly in react-hook-form. Decision: those live in `useState`; RHF owns the scalar/text fields; `handleFormSubmit` assembles both. Why: file objects + serialized editor state are awkward as RHF fields. Consequences: step-1 emptiness uses `isLexicalContentEmpty` (not `!content`); step-3 checks `mainImage?.id` manually.

  - **`draft-must-match-status.md`** (source: `eventizer-server-actions` + `eventizer-offers-wizard`; related `[[offer-wizard]]`). Context: Payload's `draft` param and the saved `_status` must agree, or "Opublikuj" silently writes drafts. Decision: `isDraft = data._status === 'draft' || !data._status`, mirrored in create + update. Why: a historical bug always passed `draft: true`. Consequences: any new offer mutation derives `draft` from `_status`.

  - **`better-auth-payload-user-sync.md`** (source: `eventizer-architecture`; related `[[auth]]`). Context: Better Auth manages sessions/OAuth; Payload needs a Users collection for admin + access control. Decision: Better Auth sessions sync to the Payload Users collection via a custom auth strategy. Why: keep one identity while using Payload's access model + admin. Consequences: protected actions load the full Payload user when `role` matters (session may carry a stale role).

  - **`polish-url-param-names.md`** (source: `eventizer-panel-conventions`; related `[[panel]]`, `[[offer-listing]]`). Context: list pages need page/filter/search params. Decision: Polish keys — `strona` (page), `filtr` (filter), `q` (query) — and Polish route segments (`/oferty`, `/ulubione`, …); only `/dashboard` stays English (historical). Why: user-facing consistency; segments are linked from emails + Stripe redirects so renaming breaks links. Consequences: new params/segments follow the Polish convention.

- [ ] **Step 3: Regenerate (decisions don't affect anchors, but confirm nothing broke)**

Run: `pnpm mind:check`
Expected: still `11 zones · 0 gaps · 0 errors`, exit 0.

- [ ] **Step 4: Commit**

```bash
git add eventizer-mind/map/decisions
git commit -m "feat(mind): seed the first six decision records"
```

### Task 10: Relocate the existing ledger into the vault

**Files:**
- Move: `docs/superpowers/specs/*.md` → `eventizer-mind/specs/`
- Move: `docs/superpowers/plans/*.md` → `eventizer-mind/plans/`
- Delete: empty `docs/superpowers/{specs,plans}`, `docs/superpowers`, `docs` (if empty), and the placeholder `.gitkeep`s in specs/plans.

- [ ] **Step 1: Move specs and plans, preserving git history**

```bash
cd /Users/muslewski/Documents/Repozytoria/eventizer
rm -f eventizer-mind/specs/.gitkeep eventizer-mind/plans/.gitkeep
git mv docs/superpowers/specs/*.md eventizer-mind/specs/
git mv docs/superpowers/plans/*.md eventizer-mind/plans/
```

(This moves THIS plan + its spec too; they now live at `eventizer-mind/plans/2026-06-02-eventizer-mind.md` and `eventizer-mind/specs/2026-06-02-eventizer-mind-design.md`. Continue executing from memory.)

- [ ] **Step 2: Remove the now-empty docs tree**

```bash
rmdir docs/superpowers/specs docs/superpowers/plans docs/superpowers docs 2>/dev/null || true
git status --short docs eventizer-mind/specs eventizer-mind/plans
```
Expected: shows the specs/plans renamed into `eventizer-mind/` and `docs/` gone.

- [ ] **Step 3: Confirm count**

Run: `ls eventizer-mind/specs eventizer-mind/plans | wc -l`
Expected: ≥ 23 (the prior 21 + this plan + spec).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(mind): relocate specs+plans ledger into the vault (history preserved)"
```

---

## PHASE 4 — Wire the projections

### Task 11: Create the root CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create `CLAUDE.md`** (lean — pointers, not copies)

```markdown
# Eventizer — Agent Guide

## DEV RULE (highest priority): orient Mind-first, maintain on finish

**Before working:** load `eventizer-mind/map/index.md` → open the relevant zone card in
`eventizer-mind/map/zones/` → trace its `sources:` (the spec/decision that produced it). Don't
work blind. The matching `eventizer-*` skill auto-loads with the procedural how-to.

**On finish (same change as the code, not a follow-up):**
- Update any touched zone card and re-stamp its `verifiedAt` to the new HEAD (`git rev-parse HEAD`).
- Add a `map/decisions/` record for any non-obvious "why".
- File a `eventizer-mind/tech-debt/` note for anything deferred.
- Run `pnpm mind:check` (or `/map-sync`) and commit the regenerated `eventizer-mind/map/index.md`.
- Don't leave ghosts: tombstone (`status: unmounted`) a removed zone, never delete it.

## PIPELINE OVERRIDE (supersedes the superpowers defaults)

- brainstorming output → `eventizer-mind/specs/YYYY-MM-DD-<name>-design.md`
- writing-plans output → `eventizer-mind/plans/YYYY-MM-DD-<name>-plan.md`

## Orientation

- Entry ramp: the `eventizer-architecture` skill → routes to the right zone + companion skill.
- The Mind's own schema + resolution ladder: `eventizer-mind/README.md`.

## Toolset

- Package manager: **pnpm** (canonical — see `eventizer-mind/map/decisions/pnpm-is-canonical.md`).
- Check the Mind: `pnpm mind:check`. Tests: `pnpm test` (vitest int + playwright e2e). Lint: `pnpm lint`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "feat(mind): root CLAUDE.md with Mind-first dev rule + pipeline override"
```

### Task 12: Refactor the 6 skills into lean projections

**Files:**
- Modify: `.claude/skills/eventizer-architecture/SKILL.md` (full rewrite → entry ramp)
- Modify: `.claude/skills/eventizer-{design-tokens,offers-wizard,panel-conventions,payload-migrations,server-actions}/SKILL.md` (prepend pointer block; keep procedural body)

- [ ] **Step 1: Rewrite `eventizer-architecture/SKILL.md` as the entry ramp** (its descriptive content now lives in the index + zone cards). Keep the frontmatter `name`/`description` intact; replace the body with:

```markdown
# Eventizer — Entry Ramp

Eventizer is a Polish event-services marketplace (https://eventizer.pl) connecting service
providers (DJs, photographers, venues, caterers, …) with clients planning events. Dark theme,
copper/gold accent, Bebas/Montserrat type, Polish-first UI. Stack: Next.js 16 (App Router,
Turbopack) · Payload 3.75 · Better Auth · Vercel Postgres + Drizzle · Stripe · Vercel Blob ·
Resend · shadcn/ui + Tailwind 4 · Motion. Package manager: **pnpm**.

## Orient via the Mind first

The canonical, verified map lives in the vault. **Before changing code:**

1. Read `eventizer-mind/map/index.md` (every zone + freshness).
2. Open the zone card you're touching in `eventizer-mind/map/zones/` — purpose, anchors,
   invariants, and `sources:` (the why).
3. Load the companion procedural skill for that zone (below).

## Zone → companion skill

| Working on… | Zone card | Procedural skill |
| --- | --- | --- |
| Offer data model / hooks / migrations | `offers-data` | eventizer-payload-migrations |
| Create/edit offer wizard | `offer-wizard` | eventizer-offers-wizard |
| Public listings (ogloszenia, map, search) | `offer-listing` | eventizer-panel-conventions (params) |
| Panel pages | `panel` | eventizer-panel-conventions |
| Auth / roles / access | `auth` | eventizer-server-actions |
| Stripe / subscriptions | `billing` | eventizer-server-actions |
| CMS blocks / pages | `content-blocks` | eventizer-design-tokens |
| UI primitives / styling | `design-system` | eventizer-design-tokens |
| Uploads / video / image position | `media` | — |
| AI content generation | `ai-content` | eventizer-server-actions |
| Any server action | (cross-cutting) | eventizer-server-actions |

On finish, follow the Mind-first maintenance rule in the root `CLAUDE.md`.
```

- [ ] **Step 2: Prepend a pointer block to each of the 5 procedural skills.** Insert immediately after the frontmatter (before the existing first heading). Keep the rest of each skill's body unchanged — these skills are already procedural, so nothing is removed; the pointer just establishes the vault as the canonical map.

  - `eventizer-offers-wizard/SKILL.md`:
    ```markdown
    > **Canonical map:** [`eventizer-mind/map/zones/offer-wizard.md`](../../../eventizer-mind/map/zones/offer-wizard.md) — what this area is, its invariants, and the decisions behind it ([[wizard-dual-form-state]], [[draft-must-match-status]]). This skill is the *procedural projection*: how to work here without breaking things.
    ```
  - `eventizer-panel-conventions/SKILL.md`:
    ```markdown
    > **Canonical map:** [`eventizer-mind/map/zones/panel.md`](../../../eventizer-mind/map/zones/panel.md) — purpose, invariants, and lineage. This skill is the *procedural projection*.
    ```
  - `eventizer-payload-migrations/SKILL.md`:
    ```markdown
    > **Canonical map:** [`eventizer-mind/map/zones/offers-data.md`](../../../eventizer-mind/map/zones/offers-data.md) + decision [`migrate-before-next-build`](../../../eventizer-mind/map/decisions/migrate-before-next-build.md). This skill is the *procedural projection*.
    ```
  - `eventizer-server-actions/SKILL.md`:
    ```markdown
    > **Canonical map:** zones [`auth`](../../../eventizer-mind/map/zones/auth.md) / [`billing`](../../../eventizer-mind/map/zones/billing.md) and decision [`draft-must-match-status`](../../../eventizer-mind/map/decisions/draft-must-match-status.md). This skill is the *procedural projection* for any `src/actions/**` file.
    ```
  - `eventizer-design-tokens/SKILL.md`:
    ```markdown
    > **Canonical map:** [`eventizer-mind/map/zones/design-system.md`](../../../eventizer-mind/map/zones/design-system.md). This skill is the *procedural projection*.
    ```

- [ ] **Step 3: Sanity-check the skill frontmatter is intact** (the `name:`/`description:` lines that drive auto-trigger must be unchanged).

Run: `for s in eventizer-architecture eventizer-offers-wizard eventizer-panel-conventions eventizer-payload-migrations eventizer-server-actions eventizer-design-tokens; do echo "== $s =="; head -4 .claude/skills/$s/SKILL.md; done`
Expected: each still opens with `---`, `name:`, `description:`, `---`.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills
git commit -m "refactor(mind): skills become lean projections pointing into the vault zones"
```

### Task 13: Fix the stale projections

**Files:**
- Delete: `bun.lock`
- Modify: `.github/copilot-instructions.md`
- Modify: `README.md`

- [ ] **Step 1: Remove the stale bun lockfile**

```bash
git rm bun.lock
```

- [ ] **Step 2: Correct the package-manager rule in `.github/copilot-instructions.md`** — find the line under Core Principles:
```
7. **Bun runtime**: When running, instead of pnpm use `bun run <script>` to ensure compatibility
```
Replace with:
```
7. **Package manager**: pnpm is canonical — use `pnpm run <script>`. See `eventizer-mind/map/decisions/pnpm-is-canonical.md`. Orient via `eventizer-mind/map/index.md` before changing code.
```

- [ ] **Step 3: Replace the boilerplate lead-in of `README.md`** — replace the first two lines:
```
# Payload Blank Template

This template comes configured with the bare minimum to get started on anything you need.
```
with:
```
# Eventizer

Polish event-services marketplace (https://eventizer.pl) — Next.js 16 + Payload 3.75 + Better Auth + Stripe.

**Agents & contributors: orient via the Mind first** — `eventizer-mind/map/index.md` is the verified
map of every zone; the root `CLAUDE.md` carries the dev rule. Package manager: **pnpm**.

---
```
(Leave the rest of the existing README below the `---` for now; deeper README cleanup is out of scope.)

- [ ] **Step 4: Commit**

```bash
git add bun.lock .github/copilot-instructions.md README.md
git commit -m "fix(mind): remove stale bun.lock, correct copilot pnpm rule, point README at the Mind"
```

---

## PHASE 5 — Green & verify

### Task 14: End-to-end verification + done-criteria

**Files:** none created; verification only (plus a possible `verifiedAt` re-stamp).

- [ ] **Step 1: Full Mind check is green**

Run: `pnpm mind:check`
Expected: `🧠 mind:check — 11 zones · 0 gaps · 0 errors`, exit 0, all zones `✅ fresh` in `index.md`.

> If `the-mind` shows `⚠ stale`: a `scripts/mind/**` file changed after its `verifiedAt` was stamped. Re-run `git rev-parse HEAD`, update `verifiedAt` in `eventizer-mind/map/zones/the-mind.md`, and `pnpm mind:check` again.

- [ ] **Step 2: Prove the gate fails loudly on a broken anchor**

```bash
cp eventizer-mind/map/zones/ai-content.md /tmp/ai-content.bak
# point a glob at a non-existent path
node -e "const f='eventizer-mind/map/zones/ai-content.md';const fs=require('fs');fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('src/app/api/generate-content/**','src/app/api/DOES-NOT-EXIST/**'))"
pnpm mind:check; echo "exit=$?"
cp /tmp/ai-content.bak eventizer-mind/map/zones/ai-content.md
pnpm mind:check; echo "exit=$?"
```
Expected: first run prints `ERROR: [ai-content] glob matches no tracked file: src/app/api/DOES-NOT-EXIST/**` and `exit=1`; after restore, `exit=0`.

- [ ] **Step 3: Hook prints a real count**

Run: `node scripts/mind/session-status.mjs`
Expected: `🧠 Mind: 11 zones · 0 open tech-debt — orient via eventizer-mind/map/index.md before coding.`

- [ ] **Step 4: Generator unit tests + lint pass**

Run: `pnpm exec vitest run tests/int/mind/generator.int.spec.ts && pnpm lint`
Expected: vitest green; eslint reports no new errors for `scripts/mind/**` and `tests/int/mind/**`. (If eslint flags the `.mjs` files, confirm they aren't excluded by `eslint.config.mjs`; scripts may be outside the lint glob — note it but don't force config changes.)

- [ ] **Step 5: Walk the done-criteria from the spec (§11) and confirm each**

- [ ] `pnpm mind:check` green; exits non-zero on a broken anchor (Steps 1–2). 
- [ ] `index.md` lists every real zone; anchors resolve.
- [ ] `the-mind` is not perpetually stale (owns `scripts/mind/**`, not the markdown).
- [ ] `CLAUDE.md` carries the dev rule + pipeline override.
- [ ] SessionStart hook prints the status line.
- [ ] No copies: skills + CLAUDE.md point into the Mind.
- [ ] Map vs Ledger never conflated; tombstone over delete.
- [ ] Stale projections cleaned (bun.lock gone, copilot corrected, README points to the Mind).
- [ ] The 21 prior specs/plans live under `eventizer-mind/` with history preserved.

- [ ] **Step 6: Final commit (if Step 1 required a re-stamp or any fixup)**

```bash
git add -A
git commit -m "chore(mind): final verification — index green, gate proven, done-criteria met" || echo "nothing to commit"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** §1 motivation → context in zones/decisions; §2 architecture → Tasks 7–13 (vault canonical, skills→projections); §3 scaffold/schema → Tasks 1–2; §4 anchors → lib `resolveAnchor` + globToRegex (Task 3); §5 zone map → Tasks 7–8 (all 11 zones, exact globs); §6 machinery → Tasks 3–6 + 11 (generator, mind:check, hook, settings.json, /map-sync, CLAUDE.md); §7 relocation+cleanup → Tasks 10, 13; §8 six decisions → Task 9; §9 phasing → the five phases; §10 non-goals → respected (no CI, no auto-debt-filing, minimal obsidian, no code refactor); §11 done-criteria → Task 14 Step 5. No gaps.

**Placeholder scan:** zone-card bodies and 5 decision bodies are sourced from named skills/specs with the exact points enumerated — not "TBD". `<HEAD_SHA>` is a fill-in produced by an explicit `git rev-parse HEAD` step. All code blocks (lib, generate, session-status, tests, settings, command, templates, README, CLAUDE, the-mind card, pnpm decision, skill rewrites) are complete.

**Type consistency:** lib exports (`globToRegex`, `matchGlob`, `grepCode`, `routeExists`, `changedFilesSince`, `parseNote`, `listNotes`, `trackedFiles`, `headSha`, `ROOT`, `sh`) match their uses in `generate.mjs` and the test. `run()` returns `{errors, gaps, warnings, rows, attic}` — matches the Task 4 test assertions. Frontmatter field names (`owns.globs/anchors/routes`, `invariants[].enforcedBy`, `verifiedAt`, `status: unmounted`) are identical across the template, the generator parser, and every zone card. Anchor scheme (`glob:`/`route:`/`symbol:`) is consistent between cards, `resolveAnchor`, and flow steps.
