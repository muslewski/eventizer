---
type: decision
summary: "The Payload `draft` boolean passed to create/update must always be derived from `_status`; never hard-code `draft: true`."
tags: [offers, payload, drafts]
status: active
created: 2026-06-02
updated: 2026-06-02
related: ["[[offer-wizard]]", "[[offers-data]]"]
sources: ["[[2026-06-02-eventizer-mind-design]]"]
decided: 2026-06-02
supersededBy: ""
---

# `draft` must be derived from `_status`, never hard-coded

## Context
Payload's `create` and `update` calls accept a `draft` boolean parameter alongside the
document data, which itself carries a `_status` field (`'draft'` or `'published'`). The two
must agree: if `draft: true` but `_status: 'published'` (or vice versa) the save misbehaves.
A historical bug in the offer wizard always passed `draft: true` unconditionally to both
`createOffer` and `updateOffer`. As a result, clicking "Opublikuj" silently produced drafts —
the user saw a success toast but the offer was never published on the public listing.

## Decision
Derive `isDraft` from `_status` in every offer mutation:

```ts
const isDraft = data._status === 'draft' || !data._status
await payload.create({ collection: 'offers', data, draft: isDraft, … })
await payload.update({ collection: 'offers', id, data, draft: isDraft, … })
```

The same derivation is applied in both `createOffer` and `updateOffer` server actions.

## Why
The `draft` flag and `_status` are two representations of the same intent: whether the document
is a draft or published. They must not diverge. Deriving `draft` from `_status` at the call
site makes the relationship explicit and eliminates the class of bugs where one changes without
the other.

## Consequences
Any new offer mutation — or any future mutation on a versioned collection — must derive `draft`
from `_status` using the canonical pattern above. Hard-coding `draft: true` is forbidden. If
`_status` is absent (e.g. a partial update), the derivation treats it as a draft, which is the
safe default. The wizard surfaces `_status` through `offerData` assembled in
`handleFormSubmit`; the server action must not override it.
