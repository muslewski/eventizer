---
type: debt
summary: "BlurText enters letters from translateY(50px); siblings placed with tiny/zero gap below get painted over until the letters settle to y:0."
tags: [hero, animation, layout]
status: open
created: 2026-06-04
updated: 2026-06-04
related: ["[[content-blocks]]"]
sources: []
severity: low
effort: low
---

# BlurText downward entrance can overlap a tight sibling below

## What
`src/components/react-bits/BlurText/index.tsx` with `direction="bottom"` initializes/animates
each letter from `transform: translateY(50px)`. When the animated text sits directly above
another element with little or no gap, the offset glyphs render on top of that element until the
IntersectionObserver fires and the letters settle to `y:0`. Intermittent — only visible while the
offset is unspent (element below the fold, slow hydration, or a web-font swap mid-animation).

Fixed for the sign-in **stat numbers** (`MediumImpact/Content/Stats`) by clipping each number
`<h2>` with `overflow-hidden` (commit re-stamped in [[content-blocks]]).

## Still latent
The "Zaufali nam najlepsi" heading in `MediumImpact/Content/index.tsx` uses the same
`direction="bottom"` BlurText and sits above the avatar row with a small `gap-4` at mobile
breakpoints — it can briefly paint over the avatars during entrance. Not fixed here because the
heading wraps to multiple lines, so a naive `overflow-hidden` risks clipping the second line; it
needs a wrapped reveal (per-line mask) or a reduced/no `y` offset.

## Risk
Cosmetic only — a brief overlap during the entrance animation. No functional impact.
