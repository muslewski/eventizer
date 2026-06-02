---
type: zone
summary: "The visual system: shadcn/ui (new-york, stone base) primitives + the stone/brand SCSS token palette, fonts, motion baseline, icon split."
tags: [ui, design, tokens]
status: active
created: 2026-06-02
updated: 2026-06-02
related: []
sources: ["[[2026-06-02-eventizer-mind-design]]"]
owns:
  routes: []
  anchors: ["symbol:Field"]
  globs:
    - "src/components/ui/**"
    - "src/styles/**"
depends: []
invariants:
  - rule: "lucide-react for UI chrome; react-icons/fa6 for brand marks only — never mixed."
    enforcedBy: ["[[skill:eventizer-design-tokens]]"]
verifiedAt: "32f283812d0ecc55e57c5b005fcaaaa2893d06ce"
---

# Design System

## Purpose
The visual foundation of Eventizer. shadcn/ui (new-york style, stone base) provides accessible
component primitives in `src/components/ui/`. The token palette is defined in `src/styles/shared.scss`
as CSS custom properties: 11 stone shades (`--color-base-0` to `--color-base-1000`) for backgrounds
and text, and brand copper/gold shades (`--color-brand-50` to `--color-brand-900`, primary accent
`rgb(210,140,8)` at `--color-brand-500`). Dark-mode swap is via `.dark` class. Typography uses
Bebas Neue for headlines (`font-bebas`) and Montserrat for body. Motion uses `motion/react` with
a spring baseline `{stiffness:300, damping:24, mass:0.8}`. Reduced-motion is honored via
`useReducedMotion()` and the `.reduce-motion` CSS class.

## Anchors
- `src/components/ui/field.tsx` — `Field` / `FieldGroup` / `FieldError` composite form layout pattern.
- `src/components/ui/` — all shadcn component primitives.
- `src/styles/shared.scss` — stone + brand token palette.
- `src/styles/global.css` — Tailwind v4 base and utility extensions.

## Invariants
- `lucide-react` for all UI chrome; `react-icons/fa6` for social brand marks only — never mixed.
- Typography: Bebas Neue for Polish headlines, Montserrat (default) for body — no inline SVG fonts.
- Animations must fall back gracefully under `.reduce-motion` / `prefers-reduced-motion`.
