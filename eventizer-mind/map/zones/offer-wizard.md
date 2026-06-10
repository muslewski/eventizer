---
type: zone
summary: "The 6-step create/edit offer wizard and its server actions: dual form state (RHF + useState), step-gated validation, publish vs draft."
tags: [offers, wizard, panel]
status: active
created: 2026-06-02
updated: 2026-06-10
related: ["[[wizard-dual-form-state]]", "[[draft-must-match-status]]", "[[server-actions-enforce-ownership]]"]
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
  - rule: "Every offer mutation/read action authenticates the session and enforces ownership (owner or moderator+) before any overrideAccess Payload call; getOffers/getOffer scope to the session user."
    enforcedBy: ["test:actions/offers"]
verifiedAt: "65085a725ed5d2977d7d9fa4877622e35fea2924"
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
- `src/actions/panel/offers.ts` — `createOffer` / `updateOffer` server actions; `draft` param derivation;
  `assertOfferOwnership` + `getFullUser` gate every mutation (see [[server-actions-enforce-ownership]]).

## Invariants
- The `draft` boolean passed to Payload must mirror `_status`: `isDraft = _status === 'draft' || !_status`.
  Passing `draft: true` unconditionally silently converts published saves to drafts.
- Lexical content empty-check must use `isLexicalContentEmpty` (recursive walk) — `!content` alone
  is wrong because an empty editor produces a root node with a paragraph child.
- Actions in `offers.ts` use `overrideAccess: true`, so ownership is enforced in-action:
  `updateOffer`/`toggleOfferStatus`/`deleteOffer` all call `assertOfferOwnership`; the incoming
  `user` field is stripped on update so owners can't reassign offers. Regression-tested in
  `tests/int/actions/offers.int.spec.ts`.
