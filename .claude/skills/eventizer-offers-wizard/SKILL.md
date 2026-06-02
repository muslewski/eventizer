---
name: eventizer-offers-wizard
description: Use when modifying the Eventizer offer creation or edit wizard — any change to steps, validation, price/category/media/content handling, or the publish vs draft flow in src/components/panel/wizard/** and src/actions/panel/offers.ts.
---

> **Canonical map:** [`eventizer-mind/map/zones/offer-wizard.md`](../../../eventizer-mind/map/zones/offer-wizard.md) — what this area is, its invariants, and the decisions behind it ([[wizard-dual-form-state]], [[draft-must-match-status]]). This skill is the *procedural projection*: how to work here without breaking things.

# Offer Wizard

The 6-step wizard in [OfferWizardForm.tsx](../../../src/components/panel/wizard/OfferWizardForm.tsx) creates and edits offers. Steps: `Podstawowe → Treść oferty → Cena i lokalizacja → Media → Kontakt → Finalizacja` (indices 0–5).

## Dual form state

Not everything is in react-hook-form.

- **RHF** (`useForm<OfferFormData>`, resolver = [offerSchema](../../../src/components/panel/wizard/offerSchema.ts)): title, category, price fields, address, phone, email, social links.
- **Separate useState**: `mainImage`, `galleryImages`, `video`, `backgroundImage` (all `UploadedFile` objects — `{ id, url, filename }`), and `content` (Lexical `SerializedEditorState`).

Submit assembles both worlds into the `offerData` passed to `createOffer` / `updateOffer` — see `handleFormSubmit`.

## Step-gated validation (three styles)

`validateCurrentStep` returns `false` to block the "Dalej" button. Each step picks the right tool:

| Step                | What it checks                    | How                                                    |
|---------------------|-----------------------------------|--------------------------------------------------------|
| 0 (Podstawowe)      | title, category                   | `await trigger(['title', 'category'])`                 |
| 1 (Treść oferty)    | Lexical content non-empty         | `isLexicalContentEmpty(content)` helper + `toast.error`|
| 2 (Cena i lokal.)   | price(s) + address                | `trigger([...])` with conditional fields               |
| 3 (Media)           | `mainImage` present               | manual `!mainImage?.id` check + toast                  |
| 4 (Kontakt)         | phone (PL regex) + email format   | `trigger(['phone', 'email'])`                          |
| 5 (Finalizacja)     | nothing gates Next; publish only  | guarded in `handleFormSubmit`                          |

For step 1, `isLexicalContentEmpty` recursively walks `root.children` — don't use `!content` alone; an empty editor still produces a root with a paragraph child.

## Publish-time guards

Payload marks `content` and `shortDescription` as `required: true`, enforced only on publish. The wizard surfaces those **inline** via client-side guards in `handleFormSubmit` when `status === 'published'` — avoids the generic backend toast "To pole jest nieprawidłowe: Główna Treść > …".

## Category slug-path contract

[CategoryPicker](../../../src/components/panel/wizard/CategoryPicker.tsx) emits `newPath.map(c => c.slug).join('/')` (e.g. `catering-napoje/catering-eventowy`). [populateCategoryData](../../../src/collections/Offers/hooks/populateCategoryData.ts) + [resolveCategory](../../../src/collections/Offers/hooks/resolveCategory.ts) resolve this to `categoryName`/`categorySlug` on `beforeChange`, and rewrite `data.category` to the canonical slug so legacy `"Name > Name"` and `"Name → Name"` values self-heal on next save.

Never match on `name` alone — the user can have any locale-formatted name. Always round-trip through `resolveCategoryByAnyFormat`.

## Flexible price range

When `hasPriceRange` is true, exactly ONE of `priceFrom`/`priceTo` is required. When both set, `priceFrom ≤ priceTo`. Display always goes through [formatOfferPrice](../../../src/lib/formatOfferPrice.ts) — never reinvent the "from X do Y" branches.

## Publish vs draft dispatch

`_status: 'published'` or `'draft'` is sent in `offerData`. The server action must pass a matching `draft: boolean` to Payload. See **eventizer-server-actions** for the exact `isDraft = data._status === 'draft' || !data._status` pattern.
