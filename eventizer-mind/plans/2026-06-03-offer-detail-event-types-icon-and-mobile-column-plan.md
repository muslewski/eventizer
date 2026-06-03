# Offer-detail "Rodzaje eventów": party-popper icon + mobile column — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Rodzaje eventów" section header icon with lucide `PartyPopper`, and stack the event-type chips vertically on mobile (`<640px`) while leaving the desktop wrapping row untouched.

**Architecture:** Two purely presentational edits in the public offer-detail view — one icon swap in `OfferDetails`, one responsive Tailwind class change on the chips wrapper in `EventTypeChips`. No data, server-action, validation, or test-logic changes. Closes with the standard Mind housekeeping (re-stamp the `offer-listing` zone, `pnpm mind:check`).

**Tech Stack:** Next.js App Router (RSC), lucide-react@1.8.0, Tailwind CSS, pnpm. Spec: [2026-06-03-offer-detail-event-types-icon-and-mobile-column-design.md](../specs/2026-06-03-offer-detail-event-types-icon-and-mobile-column-design.md).

---

## File Structure

- **Modify** `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx` — swap the section-header icon (`Sparkles` → `PartyPopper`) and fix the lucide import.
- **Modify** `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/EventTypeChips/index.tsx` — make the chip wrapper a mobile column, `sm:`+ unchanged.
- **Modify** `eventizer-mind/map/zones/offer-listing.md` — re-stamp `verifiedAt` (housekeeping).
- **Regenerated** `eventizer-mind/map/index.md` — via `pnpm mind:check`.

No files created. No new dependencies. No assets.

---

## Task 1: Swap the header icon to PartyPopper

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx` (import block lines 7-16; usage line 129)

- [ ] **Step 1: Update the lucide import**

In the import block (currently lines 7-16), replace the `Sparkles` entry with `PartyPopper`. `Sparkles` has no other use in this file, so it is fully removed here.

Change:

```tsx
import {
  FileText,
  Info,
  User as UserIcon,
  Tag,
  Sparkles,
  Banknote,
  CalendarPlus,
  CalendarClock,
} from 'lucide-react'
```

to:

```tsx
import {
  FileText,
  Info,
  User as UserIcon,
  Tag,
  PartyPopper,
  Banknote,
  CalendarPlus,
  CalendarClock,
} from 'lucide-react'
```

- [ ] **Step 2: Swap the rendered icon**

At the "Rodzaje eventów" header (currently line 129), change:

```tsx
<Sparkles className="size-6 sm:size-8 text-primary shrink-0" />
```

to:

```tsx
<PartyPopper className="size-6 sm:size-8 text-primary shrink-0" />
```

Leave the classes and the adjacent `<SpanLikeH3 title="Rodzaje eventów" />` exactly as-is.

- [ ] **Step 3: Verify no stray `Sparkles` reference remains in this file**

Run: `grep -n "Sparkles" "src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx"`
Expected: no output (empty). A non-empty result means a reference was missed — fix it before continuing.

Note: `Sparkles` still legitimately appears in `EventTypeChips/index.tsx` (the per-chip fallback icon). That is out of scope and must stay — do not touch it.

---

## Task 2: Stack chips vertically on mobile

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/EventTypeChips/index.tsx` (wrapper `<span>` line 40)

- [ ] **Step 1: Change the wrapper className**

Change the outer wrapper (currently line 40):

```tsx
<span className="flex flex-wrap items-center gap-2">
```

to:

```tsx
<span className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
```

Leave everything inside (the `allMode` hint span and the `types.map(...)` chips) untouched. The chips are `inline-flex`, so under `items-start` each pill shrinks to its text width and stacks on its own line below 640px; at `sm:`+ the row reverts to today's wrapping behavior.

---

## Task 3: Typecheck + lint + commit the code change

**Files:**
- (verification + commit only)

- [ ] **Step 1: Lint the two changed files**

Run: `pnpm lint`
Expected: passes (no new errors introduced by the edits).

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit` (or the project's typecheck script if one exists — check `package.json` scripts first).
Expected: passes — `PartyPopper` is a valid lucide-react@1.8.0 export.

- [ ] **Step 3: Visual check at the breakpoint**

Start the app (`pnpm dev`), open any offer detail page `/pl/ogloszenia/<slug>`, scroll to the "Rodzaje eventów" section, and confirm:
- The header icon is now a party-popper (not sparkles).
- At a viewport `< 640px` the chips stack in a single left-aligned column.
- At `≥ 640px` the chips are the original wrapping row.

(If a `Claude_Preview`/Playwright preview is available, capture a narrow-viewport screenshot for evidence instead of a manual check.)

- [ ] **Step 4: Commit the code change**

```bash
git add "src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx" \
        "src/app/(frontend)/[lang]/ogloszenia/[slug]/components/EventTypeChips/index.tsx"
git commit -m "feat(offer-detail): PartyPopper icon for Rodzaje eventów; stack chips in a column on mobile

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Mind housekeeping (DEV RULE — part of the same change)

**Files:**
- Modify: `eventizer-mind/map/zones/offer-listing.md` (`verifiedAt` field)
- Regenerated: `eventizer-mind/map/index.md`

- [ ] **Step 1: Get the new HEAD**

Run: `git rev-parse HEAD`
Capture the hash from Task 3's commit.

- [ ] **Step 2: Re-stamp the offer-listing zone**

Open `eventizer-mind/map/zones/offer-listing.md` and set its `verifiedAt:` frontmatter field to the hash from Step 1. (Only the `verifiedAt` value changes — the zone's content is still accurate; this is a presentational tweak within the zone, mirroring commit `5a881eb`.)

- [ ] **Step 3: Regenerate + validate the index**

Run: `pnpm mind:check`
Expected: passes; `eventizer-mind/map/index.md` regenerates and the `offer-listing` row shows ✅ fresh against the new HEAD.

- [ ] **Step 4: Commit the Mind update**

```bash
git add eventizer-mind/map/zones/offer-listing.md eventizer-mind/map/index.md
git commit -m "chore(mind): re-stamp offer-listing verifiedAt after Rodzaje eventów icon + mobile-column change

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Requirement 1 (header icon → lucide `PartyPopper`, classes kept, import fixed, `Sparkles` removed from OfferDetails only) → Task 1 (all steps) + Task 1 Step 3 guards the chip-fallback `Sparkles` stays.
- Requirement 2 (chips column on mobile, `sm:`+ unchanged, `allMode` hint becomes top line, fallback `<p>` untouched) → Task 2.
- Non-goals (no data/action/test changes, no new deps/assets) → respected; no such steps exist.
- On-finish housekeeping (re-stamp `offer-listing`, `pnpm mind:check`, commit index) → Task 4.

**Placeholder scan:** No TBD/TODO/"handle edge cases"/vague steps — every code step shows exact before/after strings and exact commands.

**Type consistency:** Single new symbol `PartyPopper` (lucide-react export) used consistently in Task 1 Steps 1 and 2. Class strings in Task 2 match the spec verbatim. Commit-message scopes consistent (`feat(offer-detail)`, `chore(mind)`).

No gaps found.
