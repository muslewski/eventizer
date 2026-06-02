---
name: eventizer-design-tokens
description: Use when styling any Eventizer UI — colors, typography, motion timing, icon choice, hover/reduced-motion behavior, or dark-mode handling. Covers the stone+brand palette, Bebas/Montserrat fonts, motion/react defaults, and the lucide vs react-icons/fa6 split.
---

> **Canonical map:** [`eventizer-mind/map/zones/design-system.md`](../../../eventizer-mind/map/zones/design-system.md). This skill is the *procedural projection*.

# Design Tokens

## Colors

Two palettes in [src/styles/shared.scss](../../../src/styles/shared.scss), exposed as CSS vars + Tailwind utilities:

- **Base (stone)** — 11 shades `--color-base-0` (white) → `--color-base-1000` (near-black). Backgrounds, borders, text.
- **Brand (antique gold / copper)** — `--color-brand-50` → `--color-brand-900`. `--color-brand-500` = `rgb(210, 140, 8)` is the primary accent.

Dark-mode swap is automatic via `.dark` class: `--background`/`--foreground` swap between base-0 and base-900; `--accent` shifts from brand-500 (light) to brand-600 (dark).

Common utilities:
- `text-accent-foreground` / `text-accent` — gold text on dark / light
- `bg-accent/5` + `border-accent/30` — hover-tint pattern (matches AnimatedCard)
- `bg-background`, `text-foreground`, `border-border/20` — neutral surfaces

Badge has a `variant="golden"` for primary accent chips.

## Typography

Two fonts, loaded in [layout.tsx](../../../src/app/(frontend)/[lang]/layout.tsx) via `next/font/google`:

- **Bebas Neue** (`font-bebas`, `--font-bebas`) — all-caps feel, wide tracking. Use for headlines: `TitleH2`, `TitleH3`, `SpanLikeH3`, footer headers, menu links, panel page titles. Typical: `font-bebas tracking-wide`.
- **Montserrat** (`font-montserrat`, `--font-montserrat`, set as default on `<body>`) — body text.

**Rule**: Polish headline? Bebas. Paragraph text? Montserrat (default, no class needed).

## Motion baseline (motion/react)

The project uses `motion/react` (not `framer-motion`). Baseline spring for card-sized UI:

```ts
{ type: 'spring', stiffness: 300, damping: 24, mass: 0.8 }
```

(See [AnimatedCard](../../../src/components/panel/AnimatedCards.tsx:40).) Faster/snappier for small UI (menu toggle): `stiffness: 400, damping: 20`. Slow/editorial (Footer lines, hero reveals): `duration: 0.6–1s` with easing `[0.25, 0.4, 0.25, 1]`.

**Entrance-on-view**: `useInView(ref, { once: true, margin: '0px 0px -60px 0px' })` is the standard trigger — don't animate every render.

**Reduced motion**: the [ReduceMotionToggle](../../../src/components/frontend/Header/ReduceMotionToggle/index.tsx) sets `.reduce-motion` on `<html>` and also respects the system media query. CSS then collapses all animations/transitions to `0.01ms`. When building motion, prefer `useReducedMotion()` from `motion/react` so you can skip complex animations entirely (not just shorten them) when the user opts out.

## Icons

Split by purpose — honor it:

- **lucide-react** — all UI chrome. Navigation, actions, status indicators, decorative chips. (`PencilIcon`, `MapPin`, `FileText`, `Compass`, `ChevronRight`, etc.)
- **react-icons/fa6** — brand marks only. Social platforms (`FaFacebook`, `FaInstagram`, `FaTiktok`, `FaLinkedin`, `FaWhatsapp`).

Never mix — don't use a react-icons generic icon for a UI button, and don't hand-roll an inline SVG for a brand mark when fa6 has it.

## Logo treatment

[HeaderLogo](../../../src/components/frontend/Header/Logo/index.tsx) is the only place using `mix-blend-normal!` + drop-shadow hover glow. Don't copy the mix-blend approach elsewhere — it's a specific visual accommodation for the logo over varied backgrounds. If you need a glow, use `drop-shadow-[0_0_12px_rgba(250,189,35,0.5)]` (the accent glow pattern).

Text over busy images uses `text-shadow-sm` / `text-shadow-white/20` utilities — the theme includes text-shadow support via `@tailwindcss/text-shadow` config.

## shadcn components in use

Available in [src/components/ui/](../../../src/components/ui/): button, badge, card, field (custom composite), input-group, toggle-group, separator, drawer, sheet, dialog, carousel, sidebar, navigation-menu, command, popover, tooltip, dropdown-menu, alert-dialog, progress, slider, skeleton, spinner, input, textarea, checkbox, radio-group, select, switch, tabs, alert, empty, pagination.

Prefer composing these over rolling custom primitives. The `Field` + `FieldGroup` + `InputGroup` + `FieldError` composition (see [field.tsx](../../../src/components/ui/field.tsx) + [input-group.tsx](../../../src/components/ui/input-group.tsx)) is the standard form layout pattern — use it.
