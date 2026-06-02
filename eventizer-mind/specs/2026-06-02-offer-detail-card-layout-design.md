---
type: spec
summary: "Two offer-detail layout tweaks: (1) on mobile, show the Opis oferty card before the Informacje card (desktop unchanged); (2) move 'Rodzaje eventów' out of the Informacje card to the END of the Opis oferty card under its own header, and render the event-type chips as a flex-wrap instead of a horizontal scroll-row."
tags: [offer-listing, ui, mobile, event-types]
status: draft
created: 2026-06-02
updated: 2026-06-02
related: ["[[offer-listing]]", "[[design-system]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
origin: "User request: on the offer page, the Opis oferty + Informacje cards look fine on desktop but on mobile should be reordered (Opis first, then Informacje). Also move 'Rodzaje eventów' from the Informacje card to the end of the Opis oferty card under a header, and display the event types as a flex-wrap (all visible) rather than the current carousel/scroll-row. Brainstormed 2026-06-02."
---

# Offer-detail card layout tweaks — Design

## Context & motivation

The offer detail page (`/ogloszenia/[slug]`) renders a two-card section in [`OfferDetails/index.tsx`](../../src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx): an **Opis oferty** card (the rich-text description, 2/3 width on desktop) and an **Informacje** card (Autor / Kategoria / Rodzaje eventów / Cena / dates, 1/3 width on desktop). Both cards, plus the event-type chips, live in this single file. The chips are rendered by [`EventTypeChips`](../../src/app/(frontend)/[lang]/ogloszenia/[slug]/components/EventTypeChips/index.tsx) (used only here) as a horizontal scroll-row.

Two problems to fix:

1. **Mobile order is reversed.** The wrapper at line 104 is `flex flex-col-reverse lg:flex-row`. DOM order is Opis → Informacje; `flex-col-reverse` flips that on mobile, so phones show **Informacje first**. Desktop (`lg:flex-row`) is fine. We want Opis first on mobile.
2. **Event types are misplaced and cramped.** "Rodzaje eventów" is an `InfoRow` buried mid-way in the Informacje card, shown as a horizontally-scrollable strip (so most chips are hidden until you scroll). It belongs with the description, fully visible.

## Design

Two files change; both are in the `offer-listing` zone.

### Change A — mobile card order

`OfferDetails/index.tsx` line 104: change the wrapper class from
`flex flex-col-reverse lg:flex-row lg:items-start …` to `flex flex-col lg:flex-row lg:items-start …`.

- **Mobile (< lg):** DOM order [Opis, Informacje] now renders top-to-bottom as **Opis oferty → Informacje**.
- **Desktop (lg+):** `lg:flex-row` is unchanged — Opis (2/3, left, sticky) and Informacje (1/3, right, sticky) render exactly as today.

This is the only change for A — one class.

### Change B — relocate event types into the Opis card as a flex-wrap

1. **Remove** the "Rodzaje eventów" `InfoRow` (current lines ~181–197) from the **Informacje** card. The card retains Autor · Kategoria · Cena · Data dodania · Ostatnia aktualizacja. The single `Separator` (after Autor) remains valid; no orphan dividers result.

2. **Add** a "Rodzaje eventów" sub-section at the **end of the Opis oferty card's `CardContent`**, immediately after the `RichText` block (still inside the same `Card`):
   - A `Separator` for visual break (with top margin, e.g. `mt-6 sm:mt-8`).
   - A sub-header: a flex row with the `Sparkles` icon (`size-5 sm:size-6 text-primary shrink-0`) + `<SpanLikeH3 title="Rodzaje eventów" />` — matching the card-title treatment one notch lighter, consistent with the design system.
   - Below the header, the event-type chips rendered flex-wrapped via `EventTypeChips`.
   - The existing `chipTypes` / `isAllEventTypes` logic is reused verbatim: offers with specific types wrap those; offers with none ("applies to all") still pass `allEventTypes` with `allMode` so every active type shows (the user's choice), preserving the *"wszystkie ·"* hint. The degenerate empty case (`chipTypes.length === 0`) still falls back to the *"Wszystkie rodzaje"* text.

3. **Convert `EventTypeChips` from scroll-row to flex-wrap.** The inner chip container changes from
   `flex min-w-0 gap-1.5 overflow-x-auto … [scrollbar-width:none] … [mask-image:linear-gradient(…)]`
   to `flex flex-wrap gap-2`, and each chip drops `shrink-0`. The chip visual (rounded pill, `border-primary/30 bg-primary/5 text-primary`, `TypeIcon` + name) and the `allMode` *"wszystkie ·"* prefix are unchanged. Since `EventTypeChips` is used only on this page, no other surface is affected.

### Mind upkeep

This change touches `src/app/(frontend)/[lang]/ogloszenia/**`, which is in the `offer-listing` zone's globs. Per the CLAUDE.md dev rule, as part of the same change: re-stamp the `offer-listing` zone card's `verifiedAt` to the new HEAD and run `pnpm mind:check`. The change is a pure layout tweak — the zone's purpose, anchors, and invariants are unchanged, so the card body and the existing invariants stay as-is; no new decision record is warranted.

## Non-goals (YAGNI)

- **No change to desktop layout** — `lg:flex-row` and the 2/3 + 1/3 sticky columns are untouched.
- **No change to which event types display** — the `chipTypes`/`allMode` data logic is reused as-is (the "applies to all → show every active type" behavior is preserved per the user's choice).
- **No redesign of the chip or the "wszystkie" hint** — only the container layout (scroll → wrap) changes.
- **No new component** — `EventTypeChips` is reshaped in place; the new sub-section is inline JSX in `OfferDetails`.
- **No change to the other offer-detail components** (OfferShortInfo, ContactInfo, etc.) or the page data queries.

## Done criteria

- [ ] On a narrow viewport, the Opis oferty card appears above the Informacje card; on `lg+`, the side-by-side layout is unchanged.
- [ ] The Informacje card no longer contains "Rodzaje eventów".
- [ ] The Opis oferty card ends with a "Rodzaje eventów" header + the event-type chips, flex-wrapped (all visible, no horizontal scroll).
- [ ] Offers with specific types show those; offers with none show every active type (`allMode`, "wszystkie ·" hint); no active types → "Wszystkie rodzaje".
- [ ] `EventTypeChips` no longer scrolls horizontally anywhere.
- [ ] `pnpm mind:check` green; `offer-listing` `verifiedAt` re-stamped to the change's HEAD.
- [ ] Committed on `feat/offer-detail-card-layout`.
