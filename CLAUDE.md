# Eventizer — Agent Guide

## DEV RULE (highest priority): orient Mind-first, maintain on finish

**Before working:** read `eventizer-mind/map/overview.md` (what Eventizer is & why) → load
`eventizer-mind/map/index.md` → open the relevant zone card in `eventizer-mind/map/zones/` →
trace its `sources:` (the spec/decision that produced it). Don't work blind. The matching
`eventizer-*` skill auto-loads with the procedural how-to.

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
