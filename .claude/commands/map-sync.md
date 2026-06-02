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
