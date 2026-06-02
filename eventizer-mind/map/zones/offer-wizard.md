---
type: zone
summary: "The 6-step create/edit offer wizard and its server actions: dual form state (RHF + useState), step-gated validation, publish vs draft."
tags: [offers, wizard, panel]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[wizard-dual-form-state]]", "[[draft-must-match-status]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: ["/panel/oferty/nowa"]
  anchors: ["symbol:OfferWizardForm"]
  globs:
    - "src/components/panel/wizard/**"
    - "src/actions/panel/offers.ts"
depends: ["[[offers-data]]", "[[ai-content]]", "[[design-system]]"]
invariants:
  - rule: "createOffer/updateOffer pass `draft` matching `_status` (draft = _status==='draft' || !_status)."
    enforcedBy: ["[[skill:eventizer-offers-wizard]]", "[[skill:eventizer-server-actions]]"]
verifiedAt: "32f283812d0ecc55e57c5b005fcaaaa2893d06ce"
---

# Offer Wizard

## Purpose
The 6-step offer creation and editing wizard (`Podstawowe → Treść oferty → Cena i lokalizacja →
Media → Kontakt → Finalizacja`). `OfferWizardForm` manages dual form state: react-hook-form
(with `offerSchema` Zod resolver) handles structured fields (title, category, price, address,
contact), while separate `useState` holds media uploads (`mainImage`, `galleryImages`, `video`,
`backgroundImage`) and Lexical editor state (`content`). Step-gated validation blocks "Dalej"
per step using `trigger([...])`, `isLexicalContentEmpty`, or manual `!mainImage?.id` checks.
Publish-time guards surface `required` Payload errors inline before the server action call.

## Anchors
- `src/components/panel/wizard/OfferWizardForm.tsx` — main wizard component (`OfferWizardForm`).
- `src/components/panel/wizard/offerSchema.ts` — Zod schema for RHF-controlled fields.
- `src/components/panel/wizard/CategoryPicker.tsx` — emits `slug-path` for `populateCategoryData`.
- `src/actions/panel/offers.ts` — `createOffer` / `updateOffer` server actions; `draft` param derivation.

## Invariants
- The `draft` boolean passed to Payload must mirror `_status`: `isDraft = _status === 'draft' || !_status`.
  Passing `draft: true` unconditionally silently converts published saves to drafts.
- Lexical content empty-check must use `isLexicalContentEmpty` (recursive walk) — `!content` alone
  is wrong because an empty editor produces a root node with a paragraph child.
