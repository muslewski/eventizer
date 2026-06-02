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
verifiedAt: "0d4889b2122265b74883b227d2b04ae94cef906e"
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
