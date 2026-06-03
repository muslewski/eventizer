---
name: offer-detail-event-types-icon-and-mobile-column
date: 2026-06-03
zone: offer-listing
status: design
baseHead: 5a881ebf106a911f9756783ad3268c6d34a549ac
---

# Offer-detail "Rodzaje eventów": party-popper icon + mobile column

## Context

On the public offer-detail page (`/ogloszenia/[slug]`), the "Opis oferty" card ends
with a **Rodzaje eventów** section: a header (icon + `SpanLikeH3` title) followed by a
flex-wrapped set of event-type chips. Two presentational tweaks are wanted. No logic,
data, or tests change.

Touched files:
- [OfferDetails/index.tsx](../../src/app/(frontend)/[lang]/ogloszenia/[slug]/components/OfferDetails/index.tsx)
- [EventTypeChips/index.tsx](../../src/app/(frontend)/[lang]/ogloszenia/[slug]/components/EventTypeChips/index.tsx)

## Requirements

### 1. Header icon → party-popper

The section header currently renders lucide `Sparkles` (OfferDetails/index.tsx:129).
Swap it for lucide **`PartyPopper`** (lucide-react@1.8.0 — confirmed available; same
confetti-popper concept as the Flaticon `party-popper_4173391` the user referenced).

- Decision: use lucide, **not** a Flaticon asset. The design-system convention is
  "lucide-react for all UI chrome (decorative chips, status indicators)" — a downloaded
  Flaticon file would break that rule, add a static asset, and carry Flaticon free-license
  attribution requirements. lucide `PartyPopper` matches the intent with none of that.
- Keep the existing classes verbatim: `size-6 sm:size-8 text-primary shrink-0`.
- Update the lucide import: drop `Sparkles`, add `PartyPopper`. `Sparkles` has no other
  use in OfferDetails (only the import line and line 129), so it is fully removed there.

**Out of scope:** the per-chip fallback icon `TypeIcon` inside EventTypeChips (rendered
when an individual event type has no uploaded icon) keeps its own `Sparkles`. That is a
distinct concern from the section header and is intentionally left unchanged.

### 2. Chips stack vertically on mobile

The chips wrapper is currently `flex flex-wrap items-center gap-2` (EventTypeChips/index.tsx:40)
— a wrapping row at every screen size. Change it to a single-column stack on mobile while
keeping today's wrapping row from the `sm` breakpoint up:

```
flex flex-wrap items-center gap-2
→ flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center
```

- Breakpoint is `sm` (640px) — the dominant responsive breakpoint already used throughout
  OfferDetails, so the switch lines up with the rest of the card.
- Below 640px: each chip on its own line, left-aligned, pill sized to its content
  (the chips are `inline-flex`, so `items-start` shrinks them to text width).
- At/above 640px: byte-for-byte today's behavior.
- The `allMode` "wszystkie&nbsp;·" hint stays as the first child; on mobile it becomes the
  top line of the column (reads as a lead-in — acceptable).
- The empty-selection fallback `<p>Wszystkie rodzaje</p>` lives in OfferDetails, outside
  this component — unaffected.

## Non-goals

- No change to data, server actions, validation, or the wizard.
- No change to the desktop (`sm:`+) layout.
- No new dependencies or static assets.
- No test changes (purely presentational; covered by existing e2e if any).

## On finish (DEV RULE housekeeping)

- Offer-detail belongs to the `offer-listing` zone. Update its zone card if needed and
  re-stamp `verifiedAt` to the new HEAD (mirrors recent commit `5a881eb`).
- Run `pnpm mind:check` and commit the regenerated `eventizer-mind/map/index.md`.
- No `decisions/` record needed — the lucide-vs-Flaticon "why" is captured here and is a
  straightforward application of the existing icon-split convention.
