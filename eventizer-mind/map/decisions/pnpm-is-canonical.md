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
