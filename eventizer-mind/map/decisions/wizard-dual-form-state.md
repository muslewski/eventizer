---
type: decision
summary: "The offer wizard splits state between react-hook-form (scalar fields) and separate useState hooks (media objects and Lexical editor state)."
tags: [offers, wizard, forms]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[offer-wizard]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
decided: 2026-06-02
supersededBy: ""
---

# Dual form state in the offer wizard

## Context
The 6-step offer wizard needs to track both scalar/text data and richer object types. Media
fields (`mainImage`, `galleryImages`, `video`, `backgroundImage`) are `UploadedFile` objects
(`{ id, url, filename }`) that don't have a clean HTML-input equivalent. The Lexical `content`
field holds a `SerializedEditorState` — a nested JSON tree that an editor component manages
internally. Attempting to register these as react-hook-form controlled fields produces noisy
value coercions and makes the schema resolver awkward to write.

## Decision
Media fields and `content` live in separate `useState` hooks. React-hook-form (with a Zod
`offerSchema` resolver) owns all scalar and text fields: title, category, price fields, address,
phone, email, and social links. The `handleFormSubmit` function assembles both worlds into the
`offerData` payload that is passed to `createOffer` / `updateOffer`.

## Why
File objects and serialized editor state are awkward and noisy as RHF-controlled fields. Keeping
them in plain `useState` keeps the Zod schema focused on validatable primitives while still
allowing `handleFormSubmit` to merge everything before submission. This is the same pattern used
by most rich-editor integrations: the editor owns its state; the form owns everything else.

## Consequences
Step-1 (Treść oferty) emptiness validation uses the recursive `isLexicalContentEmpty` helper
rather than a simple `!content` check — an empty editor still produces a root node with a
paragraph child, so a falsy check would always pass. Step-3 (Media) main-image presence is a
manual `!mainImage?.id` check paired with a `toast.error`, not a resolver rule, because the
image object is outside RHF. Any new field that is a rich object (file, editor state, complex
nested struct) follows the same split: `useState` + manual validation in `validateCurrentStep`.
