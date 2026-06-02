# Offer-detail Card Layout Tweaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the offer detail page, show the Opis oferty card before the Informacje card on mobile (desktop unchanged), and move "Rodzaje eventów" out of the Informacje card to the end of the Opis card as a flex-wrap of all event-type chips.

**Architecture:** Pure presentational change in two existing components — `EventTypeChips` (scroll-row → flex-wrap) and `OfferDetails` (one mobile-order class + relocate the event-types block). No data/query/logic changes; the `chipTypes`/`isAllEventTypes` logic is reused as-is. Closes with Mind upkeep (re-stamp the `offer-listing` zone).

**Tech Stack:** React 19 + Next 16 (client components under the live-preview tree), Tailwind v4, shadcn `Card`/`Separator`, lucide `Sparkles`, the project's `SpanLikeH3` headline. Verification via `pnpm exec tsc --noEmit` (no new errors) + structural greps; `pnpm mind:check` for the zone re-stamp.

**Spec:** `eventizer-mind/specs/2026-06-02-offer-detail-card-layout-design.md`.

**Branch:** `feat/offer-detail-card-layout` (already created; do NOT switch). pnpm. Commit per task.

> Note on testing: this is a CSS/layout change with no unit-testable logic, so there is no TDD test. The gate per task is `tsc` clean for the touched files + structural greps confirming the exact change. Visual confirmation (the actual mobile reorder + wrapped chips) is recommended via the running app but not required by the plan.

---

### Task 1: Convert `EventTypeChips` from scroll-row to flex-wrap

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/EventTypeChips/index.tsx`

- [ ] **Step 1: Update the JSDoc comment.** Replace exactly:

```tsx
/**
 * Compact, horizontally-scrollable row of an offer's event types — one chip
 * per type. No auto-motion: the user scrolls at their own pace. The scrollbar
 * is hidden and the row edge-fades so it reads as content, not a control. When
 * `allMode` is set the row is prefixed with a small "wszystkie ·" hint.
 */
```

with:

```tsx
/**
 * A flex-wrapped set of an offer's event types — one chip per type, all visible
 * (no horizontal scroll). When `allMode` is set the set is prefixed with a small
 * "wszystkie ·" hint (the offer applies to every event type).
 */
```

- [ ] **Step 2: Replace the `return` block** (flatten the inner scroll container into a single flex-wrap span; drop `overflow-x-auto`, the scrollbar-hiding utilities, the edge-fade mask, and every `shrink-0`). Replace exactly:

```tsx
  return (
    <span className="flex min-w-0 items-center gap-2">
      {allMode && (
        <span className="shrink-0 text-xs text-muted-foreground">wszystkie&nbsp;·</span>
      )}
      <span
        className="flex min-w-0 gap-1.5 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_0.5rem,black_calc(100%-0.75rem),transparent)]"
      >
        {types.map((t) => (
          <span
            key={t.id}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-sm font-medium text-primary"
          >
            <TypeIcon icon={t.icon} />
            {t.name}
          </span>
        ))}
      </span>
    </span>
  )
```

with:

```tsx
  return (
    <span className="flex flex-wrap items-center gap-2">
      {allMode && (
        <span className="text-xs text-muted-foreground">wszystkie&nbsp;·</span>
      )}
      {types.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-sm font-medium text-primary"
        >
          <TypeIcon icon={t.icon} />
          {t.name}
        </span>
      ))}
    </span>
  )
```

(Leave the rest of the file unchanged: `'use client'`, imports, `TypeIcon`, the `EventTypeChipsProps` interface, and the `if (types.length === 0) return null` guard.)

- [ ] **Step 3: Verify.** Run:

```bash
cd /Users/muslewski/Documents/Repozytoria/eventizer
F=src/app/\(frontend\)/\[lang\]/ogloszenia/\[slug\]/components/EventTypeChips/index.tsx
grep -c "flex flex-wrap" "$F"          # expect 1
grep -c "overflow-x-auto\|mask-image\|shrink-0" "$F"   # expect 0
pnpm exec tsc --noEmit 2>&1 | grep "EventTypeChips" || echo "OK: no tsc errors in EventTypeChips"
```
Expected: `1`, then `0`, then `OK: no tsc errors in EventTypeChips`.

- [ ] **Step 4: Commit.**

```bash
git add "src/app/(frontend)/[lang]/ogloszenia/[slug]/components/EventTypeChips/index.tsx"
git commit -m "refactor(event-types): flex-wrap the offer-page chips instead of a horizontal scroll-row"
```

---

### Task 2: Reorder cards on mobile + move event types into the Opis card

**Files:**
- Modify: `src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx`

All three edits are in this one file. `Separator`, `Sparkles`, `SpanLikeH3`, and `EventTypeChips` are already imported; `chipTypes` and `isAllEventTypes` are already computed (lines ~98–99). No import changes are needed (all four remain used after the edits).

- [ ] **Step 1: Fix the mobile order** (the two-card flex wrapper). Replace exactly:

```tsx
      <div className="flex flex-col-reverse lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-12 w-full min-w-0 ">
```

with:

```tsx
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-12 w-full min-w-0 ">
```

(Only `flex-col-reverse` → `flex-col`. Mobile now stacks Opis → Informacje in DOM order; `lg:flex-row` keeps desktop identical.)

- [ ] **Step 2: Add the "Rodzaje eventów" sub-section at the end of the Opis card.** Replace exactly:

```tsx
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              {offer.content && (
                <RichText
                  data={offer.content}
                  enableGutter={false}
                  enableProse
                    className="prose-lg max-w-none"
                />
              )}
            </CardContent>
```

with:

```tsx
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              {offer.content && (
                <RichText
                  data={offer.content}
                  enableGutter={false}
                  enableProse
                  className="prose-lg max-w-none"
                />
              )}

              {/* Event types — shown at the end of the description as a flex-wrap
                  of all chips. Empty selection = applies to every type, so we show
                  the full active list (allMode); the degenerate empty case falls
                  back to a plain "Wszystkie rodzaje". */}
              <Separator className="mt-6 sm:mt-8" />
              <div className="mt-6 sm:mt-8 flex items-center gap-4 sm:gap-6">
                <Sparkles className="size-6 sm:size-8 text-primary shrink-0" />
                <SpanLikeH3 title="Rodzaje eventów" />
              </div>
              <div className="mt-4">
                {chipTypes.length > 0 ? (
                  <EventTypeChips types={chipTypes} allMode={isAllEventTypes} />
                ) : (
                  <p className="font-medium text-lg text-muted-foreground">Wszystkie rodzaje</p>
                )}
              </div>
            </CardContent>
```

- [ ] **Step 3: Remove the event-types `InfoRow` from the Informacje card.** Replace exactly:

```tsx
              {/* Event types — compact horizontal scroll row of chips. Empty
                  selection = applies to every type, so we show the full active
                  list prefixed with a "wszystkie ·" hint. */}
              <InfoRow
                iconContent={<Sparkles className="size-5 text-primary" />}
                label="Rodzaje eventów"
                value={
                  chipTypes.length > 0 ? (
                    <EventTypeChips types={chipTypes} allMode={isAllEventTypes} />
                  ) : (
                    'Wszystkie rodzaje'
                  )
                }
                valueClassName={
                  chipTypes.length > 0 ? 'mt-0.5' : 'font-medium text-lg text-muted-foreground'
                }
              />

              {/* Price */}
```

with:

```tsx
              {/* Price */}
```

- [ ] **Step 4: Verify.** Run:

```bash
cd /Users/muslewski/Documents/Repozytoria/eventizer
F=src/app/\(frontend\)/\[lang\]/ogloszenia/\[slug\]/components/OfferDetails/index.tsx
grep -c "flex-col-reverse" "$F"        # expect 0
grep -c "Rodzaje eventów" "$F"         # expect 1 (now only the new Opis-card header)
grep -c "SpanLikeH3 title=\"Rodzaje eventów\"" "$F"   # expect 1
pnpm exec tsc --noEmit 2>&1 | grep "OfferDetails" || echo "OK: no tsc errors in OfferDetails"
```
Expected: `0`, `1`, `1`, then `OK: no tsc errors in OfferDetails`.

- [ ] **Step 5: Commit.**

```bash
git add "src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx"
git commit -m "feat(offer-detail): Opis before Informacje on mobile; move Rodzaje eventów to end of Opis card"
```

---

### Task 3: Mind upkeep — re-stamp the `offer-listing` zone

**Files:**
- Modify: `eventizer-mind/map/zones/offer-listing.md` (`verifiedAt`)
- Modify: `eventizer-mind/map/index.md` (regenerated)

The code change touched `src/app/(frontend)/[lang]/ogloszenia/**`, which is in the `offer-listing` zone's globs — so per the CLAUDE.md dev rule, re-stamp its `verifiedAt`. The zone's purpose/anchors/invariants are unchanged (pure layout tweak), so only `verifiedAt` changes.

- [ ] **Step 1: Confirm the zone shows stale, then re-stamp to the code HEAD.** Run:

```bash
cd /Users/muslewski/Documents/Repozytoria/eventizer
pnpm mind:check 2>&1 | tail -1     # offer-listing likely ⚠ stale now (ogloszenia changed since its verifiedAt)
HEAD_NOW=$(git rev-parse HEAD)
node -e "const f='eventizer-mind/map/zones/offer-listing.md';const fs=require('fs');fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(/verifiedAt: \"[a-f0-9]+\"/,'verifiedAt: \"$HEAD_NOW\"'))"
grep verifiedAt eventizer-mind/map/zones/offer-listing.md   # should show $HEAD_NOW
```

- [ ] **Step 2: Regenerate + confirm green and fresh.** Run:

```bash
pnpm mind:check 2>&1 | tail -1
grep -c "offer-listing.*stale" eventizer-mind/map/index.md   # expect 0
```
Expected: `🧠 mind:check — 11 zones · 1 gaps · 0 errors` (the 1 gap is the pre-existing auth gap), and `0` (offer-listing is fresh again).

- [ ] **Step 3: Commit.**

```bash
git add eventizer-mind/map/zones/offer-listing.md eventizer-mind/map/index.md
git commit -m "chore(mind): re-stamp offer-listing verifiedAt after offer-detail layout change"
```

---

## Self-Review

**Spec coverage:** spec §"Change A — mobile card order" → Task 2 Step 1 (`flex-col-reverse` → `flex-col`). §"Change B" item 1 (remove from Informacje) → Task 2 Step 3; item 2 (new sub-section at end of Opis: Separator + Sparkles + SpanLikeH3 "Rodzaje eventów" + chips, with `chipTypes`/`isAllEventTypes`/empty-fallback preserved) → Task 2 Step 2; item 3 (`EventTypeChips` scroll → flex-wrap) → Task 1. §"Mind upkeep" → Task 3. §Done-criteria → covered by the per-task greps (flex-col-reverse gone; one "Rodzaje eventów" header; no overflow-x-auto anywhere; offer-listing re-stamped + mind:check green). No gaps.

**Placeholder scan:** every edit gives the exact `old`→`new` text; no "TBD"/"handle X"/vague steps. The empty-state fallback is concrete (`<p>…Wszystkie rodzaje</p>`). No placeholders.

**Type consistency:** no new props, functions, or types are introduced — `EventTypeChips`'s public signature (`types`, `allMode`) is unchanged (only its internal markup changes), so the call site in `OfferDetails` Step 2 still matches. `chipTypes` and `isAllEventTypes` referenced in Task 2 are the existing computed values in the file. `Separator`/`Sparkles`/`SpanLikeH3`/`EventTypeChips` are all already imported and remain used after the edits (no unused-import breakage). The reordered/relocated markup introduces no new identifiers.
