# Offer detail cards — visual redesign

**Date**: 2026-04-23
**Scope**: `src/components/panel/oferty/OfferDetailView.tsx` info grid (the six metadata cards).
**Not in scope**: hero header, media gallery, action buttons, collection schema, server actions.

## Problem

The offer detail view renders six small info cards (Kategoria, Cena, Lokalizacja, Zasięg, Opis, Kontakt). Two UX issues:

1. **Inconsistent headers** — the four top cards use `CardDescription` (small uppercase label), the two wide cards (Opis, Kontakt) use `CardTitle` (large heading). Same page, two conventions.
2. **Visually flat** — plain labels over plain values. No icons, no texture, nothing that communicates "category" vs "location" vs "price" at a glance.

Goal: unify the header treatment and make each card tell its own visual story (icon, light motion, map backdrop) without changing data, routes, or layout.

## Non-goals

- Changing what data the cards display.
- Adding new DB columns or API endpoints.
- Touching the public offer page (`/ogloszenia/[slug]`) or the panel offer list (`/panel/oferty`).
- Adding interactive maps, share-sheets, or CTA buttons inside the cards.
- Writing tests for presentational components — only the static-map URL builder.

## Design

### Extraction

Split the inline info grid out of `OfferDetailView.tsx` into focused files under a new directory:

```
src/components/panel/oferty/detail/
  InfoCardShell.tsx       — shared icon chip + title + description header
  InfoCardGrid.tsx        — composes 4+2 grid, wraps each card in AnimatedCard
  CategoryCard.tsx
  PriceCard.tsx
  LocationCard.tsx
  RadiusCard.tsx
  DescriptionCard.tsx
  ContactCard.tsx
  staticMapUrl.ts         — pure URL builder for the Maps Static API
```

`OfferDetailView.tsx` keeps the hero, media, and action row. It replaces the inline grid with `<InfoCardGrid offer={offer} lang={lang} />`.

### `InfoCardShell`

```tsx
interface InfoCardShellProps {
  icon: LucideIcon
  title: string            // e.g. "Cena"
  description: string      // e.g. "Cena lub zakres cenowy oferty"
  className?: string       // per-card overrides (e.g. location backdrop)
  children: ReactNode
}
```

Renders a shadcn `Card` with:
- `CardHeader` containing an `icon-chip` (34×34, `rounded-[10px]`, gold-tinted gradient + border, lucide icon inside) next to `<CardTitle>{title}</CardTitle>` + `<CardDescription>{description}</CardDescription>`.
- `CardContent` holding `{children}`.

All six cards share the same header shape — this is the unification point.

### Icons and descriptions

| Card        | Icon (`lucide-react`) | Description                        |
|-------------|-----------------------|------------------------------------|
| Kategoria   | `Tags`                | Branża, w której działasz          |
| Cena        | `Banknote`            | Cena lub zakres cenowy oferty      |
| Lokalizacja | `MapPin`              | Skąd świadczysz usługi             |
| Zasięg      | `Compass`             | Promień dojazdu                    |
| Opis        | `FileText`            | Krótkie streszczenie oferty        |
| Kontakt     | `Phone`               | Dane kontaktowe do klientów        |

Descriptions are static Polish strings — same layer as the rest of the panel copy.

### Animation (reuse)

Every card is wrapped in the existing [`AnimatedCard`](../../src/components/panel/AnimatedCards.tsx) primitive inside `InfoCardGrid`. That provides:
- Spring fade-in on view (`initial={{ opacity: 0, y: 20, scale: 0.97 }}` → rest).
- Hover lift (`y: -3`, `scale: 1.01`) + accent-tinted background/border, already targeting shadcn `[data-slot=card]`.

No separate hover / entrance logic per card.

### Price card — animated count-up

Uses `motion/react` (already a project dep). Single new hook/pattern inside `PriceCard.tsx`:

```tsx
const motionValue = useMotionValue(0)
const spring = useSpring(motionValue, { stiffness: 80, damping: 20 })
const display = useTransform(spring, (v) => Math.round(v).toLocaleString('pl-PL'))
const ref = useRef<HTMLDivElement>(null)
const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })
useEffect(() => { if (inView) motionValue.set(target) }, [inView, target])
```

Rendered as `<motion.span>{display}</motion.span> zł`. For price ranges, two counters animate in parallel and the card reads e.g. "100 – 400 zł". Partial ranges (from-only / to-only) animate the single value with the "od" / "do" prefix. `formatOfferPrice` remains the source of truth for label shape — the animated output converges to its result.

**Reduced motion**: `useReducedMotion()` guard — when true, skip the spring and render the final number directly.

### Location card — Google Static Map backdrop

A new pure helper `staticMapUrl.ts`:

```ts
export function buildStaticMapUrl({
  lat, lng, apiKey, width = 640, height = 280,
}: { lat: number | null | undefined; lng: number | null | undefined; apiKey: string; width?: number; height?: number }): string | null
```

Returns `null` when `apiKey` is empty or coords are missing; otherwise returns a `maps.googleapis.com/maps/api/staticmap` URL with:
- `center={lat},{lng}`, `zoom=12`, `size={width}x{height}`, `scale=2`
- A single gold-colored marker at the same coords (`markers=color:0xFABD23|{lat},{lng}`)
- A short dark `style=` parameter matching the stone-950 panel background
- `key={NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` (same key already used by the Maps JS loader)

Inside `LocationCard.tsx`, the URL goes into an absolute-positioned `<img>` behind the content; a `linear-gradient` overlay darkens the bottom half so the address text remains readable. `onError` hides the image on failure. Coords missing → plain gradient backdrop, no image. No error state shown.

**Key exposure caveat**: the key is already public via the Maps JS loader. HTTP Referer restrictions on the key in GCP are what protect it — same story as today. No new exposure.

### Radius card

Pure CSS: a 56×56 circle with `border: 2px dashed rgba(250,189,35,0.5)`, the `Compass` icon centered. "50 km" renders as the primary value next to the ring; "od lokalizacji" as helper meta below. No animation.

### Description card

Body renders `offer.shortDescription` as a pull-quote (italic, muted, `leading-relaxed`). Existing sentence "Pełny opis dostępny na stronie oferty." becomes a helper line below. Empty `shortDescription` → muted "Brak krótkiego opisu" placeholder so the card never collapses.

### Contact card

Move the existing contact rendering block (phone / email / website / facebook / instagram / tiktok / linkedin with their lucide + react-icons) from `OfferDetailView.tsx` into `ContactCard.tsx`. Reuse `InfoCardShell` for the header. Keep the existing "Brak danych kontaktowych" empty state. No brand icon changes.

### Layout

Grid stays: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, with Opis + Kontakt using `lg:col-span-2`. Gap unchanged.

## Edge cases

- **Missing `location.lat`/`lng`** → static-map URL returns `null` → plain gradient backdrop, address text still visible.
- **Static map request fails at runtime** → `<img onError>` hides the image, overlay + text remain.
- **All price fields null** → "Cena do ustalenia", no animation.
- **Long category path** → inherits the wrapping fix already applied to the category badge (previous PR).
- **Empty `shortDescription`** → muted placeholder.
- **`prefers-reduced-motion`** → count-up skipped; `AnimatedCard`'s existing entrance becomes a cheap opacity-only fade (motion/react handles this natively).
- **SSR** → all new card files are `'use client'`. `OfferDetailView` (server component) passes serializable `offer` + `lang` into `<InfoCardGrid>`.

## Testing

One unit test file: `staticMapUrl.test.ts` (Vitest).

Covers:
- Returns `null` when `apiKey` is empty.
- Returns `null` when `lat` or `lng` is `null`/`undefined`.
- Returns a URL containing `center={lat},{lng}`, `scale=2`, the gold marker color, and the key when inputs are valid.

No tests for `InfoCardShell`, `PriceCard`, etc. — they're presentational. Manual QA on a real offer page is the verification path.

## Rollout

Single PR. No migration, no feature flag, no env changes (Maps key already set). Deploy → open `/pl/panel/oferty/<slug>` → verify hover lift, price count-up, static-map backdrop on a populated offer; verify fallback by temporarily clearing coords or unsetting the env key locally.
