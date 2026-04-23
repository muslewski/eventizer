# Offer Detail Cards Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat 6-card info grid on `/panel/oferty/[slug]` with a unified, iconified, lightly-animated version that matches the rest of `/panel`.

**Architecture:** Extract the inline grid out of `OfferDetailView.tsx` into a dedicated folder of focused components. All cards share an `InfoCardShell` primitive (icon chip + title + description header). The Price card animates its number with `motion/react`; the Location card uses a Google Static Map backdrop; every card is wrapped in the existing `AnimatedCard` primitive for the entrance + hover treatment already used elsewhere in `/panel`.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · `motion/react` (already installed) · `lucide-react` · `react-icons/fa6` (existing socials) · Tailwind v4 · shadcn Card primitives · Google Maps Static API (existing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) · Vitest.

**Reference skills to load:** `eventizer-panel-conventions`, `eventizer-design-tokens`, `eventizer-offers-wizard` (for `formatOfferPrice` context).

---

## File structure

```
src/components/panel/oferty/
  OfferDetailView.tsx           — MODIFY: swap inline info grid for <InfoCardGrid/>
  detail/
    staticMapUrl.ts             — CREATE: pure URL builder for Maps Static API
    InfoCardShell.tsx           — CREATE: icon chip + title + description header
    InfoCardGrid.tsx            — CREATE: composes 4+2 grid, wraps each card in AnimatedCard
    CategoryCard.tsx            — CREATE
    PriceCard.tsx               — CREATE: animated count-up number
    LocationCard.tsx            — CREATE: static map backdrop + overlay
    RadiusCard.tsx              — CREATE: dashed compass ring + value
    DescriptionCard.tsx         — CREATE
    ContactCard.tsx             — CREATE: ports existing contact block

tests/int/
  static-map-url.int.spec.ts    — CREATE: unit test for the URL builder
```

Only `staticMapUrl` is unit-tested (pure function). Presentational components are verified manually on the running page — see Task 11.

---

### Task 1: `staticMapUrl` pure helper with tests (TDD)

**Files:**
- Create: `src/components/panel/oferty/detail/staticMapUrl.ts`
- Create: `tests/int/static-map-url.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/static-map-url.int.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildStaticMapUrl } from '@/components/panel/oferty/detail/staticMapUrl'

describe('buildStaticMapUrl', () => {
  const validInput = { lat: 52.2297, lng: 21.0122, apiKey: 'test-key' }

  it('returns null when apiKey is empty', () => {
    expect(buildStaticMapUrl({ ...validInput, apiKey: '' })).toBeNull()
  })

  it('returns null when lat is null', () => {
    expect(buildStaticMapUrl({ ...validInput, lat: null as unknown as number })).toBeNull()
  })

  it('returns null when lng is undefined', () => {
    expect(
      buildStaticMapUrl({ ...validInput, lng: undefined as unknown as number }),
    ).toBeNull()
  })

  it('includes center, scale=2, gold marker and key for valid input', () => {
    const url = buildStaticMapUrl(validInput)
    expect(url).not.toBeNull()
    expect(url).toContain('center=52.2297,21.0122')
    expect(url).toContain('scale=2')
    expect(url).toContain('markers=color:0xFABD23|52.2297,21.0122')
    expect(url).toContain('key=test-key')
    expect(url).toMatch(/^https:\/\/maps\.googleapis\.com\/maps\/api\/staticmap\?/)
  })

  it('honours custom width and height', () => {
    const url = buildStaticMapUrl({ ...validInput, width: 800, height: 400 })
    expect(url).toContain('size=800x400')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm run test:int -- static-map-url`
Expected: FAIL — "Cannot find module '@/components/panel/oferty/detail/staticMapUrl'".

- [ ] **Step 3: Write minimal implementation**

Create `src/components/panel/oferty/detail/staticMapUrl.ts`:

```ts
interface BuildStaticMapUrlInput {
  lat: number | null | undefined
  lng: number | null | undefined
  apiKey: string
  width?: number
  height?: number
}

/**
 * Build a Google Maps Static API URL for the offer's coordinates.
 * Returns null when the API key is empty or coordinates are missing,
 * so callers can render a graceful fallback backdrop.
 */
export function buildStaticMapUrl({
  lat,
  lng,
  apiKey,
  width = 640,
  height = 280,
}: BuildStaticMapUrlInput): string | null {
  if (!apiKey || lat == null || lng == null) return null

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '12',
    size: `${width}x${height}`,
    scale: '2',
    key: apiKey,
  })
  // URLSearchParams escapes the `|` in `markers`; append manually.
  const markers = `markers=color:0xFABD23|${lat},${lng}`
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}&${markers}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm run test:int -- static-map-url`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/panel/oferty/detail/staticMapUrl.ts tests/int/static-map-url.int.spec.ts
git commit -m "feat(panel): static map URL helper for offer location card"
```

---

### Task 2: `InfoCardShell` primitive

**Files:**
- Create: `src/components/panel/oferty/detail/InfoCardShell.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/panel/oferty/detail/InfoCardShell.tsx`:

```tsx
import { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InfoCardShellProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  children: ReactNode
}

/**
 * Shared shell for every card in the offer detail info grid.
 *
 * - Icon chip (34x34, rounded-[10px], accent-gold gradient) next to a CardTitle
 * - CardDescription underneath with the helper line
 * - CardContent wraps the per-card body
 *
 * The card is a shadcn <Card>, so it picks up the AnimatedCard hover
 * treatment (accent-tinted bg + border on hover) automatically when
 * wrapped by <AnimatedCard> in InfoCardGrid.
 */
export function InfoCardShell({
  icon: Icon,
  title,
  description,
  className,
  children,
}: InfoCardShellProps) {
  return (
    <Card className={cn('bg-background border-border/20 overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <span
          aria-hidden="true"
          className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-[10px] border border-accent/25 bg-gradient-to-b from-accent/20 to-accent/5 text-accent"
        >
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <CardTitle className="text-base leading-tight">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Typecheck passes**

Run: `pnpm exec tsc --noEmit -p .`
Expected: No errors introduced by the new file (pre-existing unused-var lints elsewhere are OK — see session history).

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/oferty/detail/InfoCardShell.tsx
git commit -m "feat(panel): InfoCardShell primitive for offer detail cards"
```

---

### Task 3: `CategoryCard`

**Files:**
- Create: `src/components/panel/oferty/detail/CategoryCard.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/panel/oferty/detail/CategoryCard.tsx`:

```tsx
import { Tags } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { InfoCardShell } from './InfoCardShell'

interface CategoryCardProps {
  categoryName: string | null | undefined
}

export function CategoryCard({ categoryName }: CategoryCardProps) {
  return (
    <InfoCardShell
      icon={Tags}
      title="Kategoria"
      description="Branża, w której działasz"
    >
      {categoryName ? (
        <Badge
          variant="outline"
          className="h-auto max-w-full whitespace-normal break-words rounded-md text-left leading-snug"
        >
          {categoryName}
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">Brak kategorii</span>
      )}
    </InfoCardShell>
  )
}
```

Rationale: preserves the existing wrapping-badge behavior from `f249b0d`.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/oferty/detail/CategoryCard.tsx
git commit -m "feat(panel): CategoryCard using InfoCardShell"
```

---

### Task 4: `RadiusCard`

**Files:**
- Create: `src/components/panel/oferty/detail/RadiusCard.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/panel/oferty/detail/RadiusCard.tsx`:

```tsx
import { Compass } from 'lucide-react'
import { InfoCardShell } from './InfoCardShell'

interface RadiusCardProps {
  radiusKm: number | null | undefined
}

export function RadiusCard({ radiusKm }: RadiusCardProps) {
  return (
    <InfoCardShell
      icon={Compass}
      title="Zasięg"
      description="Promień dojazdu"
    >
      {radiusKm != null ? (
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-accent/50 text-accent"
          >
            <Compass className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-semibold leading-none tabular-nums">
              {radiusKm} km
            </span>
            <span className="text-xs text-muted-foreground">od lokalizacji</span>
          </div>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Brak danych</span>
      )}
    </InfoCardShell>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/oferty/detail/RadiusCard.tsx
git commit -m "feat(panel): RadiusCard with dashed compass ring"
```

---

### Task 5: `DescriptionCard`

**Files:**
- Create: `src/components/panel/oferty/detail/DescriptionCard.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/panel/oferty/detail/DescriptionCard.tsx`:

```tsx
import { FileText } from 'lucide-react'
import { InfoCardShell } from './InfoCardShell'

interface DescriptionCardProps {
  shortDescription: string | null | undefined
}

export function DescriptionCard({ shortDescription }: DescriptionCardProps) {
  const hasDescription = shortDescription && shortDescription.trim().length > 0

  return (
    <InfoCardShell
      icon={FileText}
      title="Opis"
      description="Krótkie streszczenie oferty"
    >
      {hasDescription ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm italic leading-relaxed text-muted-foreground">
            {shortDescription}
          </p>
          <span className="text-xs text-muted-foreground/70">
            Pełny opis dostępny na stronie oferty.
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Brak krótkiego opisu</span>
      )}
    </InfoCardShell>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/oferty/detail/DescriptionCard.tsx
git commit -m "feat(panel): DescriptionCard with pull-quote snippet"
```

---

### Task 6: `ContactCard` — port existing contact block

**Files:**
- Create: `src/components/panel/oferty/detail/ContactCard.tsx`
- Reference: `src/components/panel/oferty/OfferDetailView.tsx` (existing contact rendering — the block that renders `offer.phone` / `offer.email` / `socialMedia.website` / `socialMedia.facebook` / `socialMedia.instagram` / `socialMedia.tiktok` / `socialMedia.linkedin`)

- [ ] **Step 1: Create the file**

Create `src/components/panel/oferty/detail/ContactCard.tsx`:

```tsx
import { Phone, PhoneIcon, MailIcon, GlobeIcon } from 'lucide-react'
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin } from 'react-icons/fa6'
import type { Offer } from '@/payload-types'
import { InfoCardShell } from './InfoCardShell'

interface ContactCardProps {
  offer: Offer
}

export function ContactCard({ offer }: ContactCardProps) {
  const socialMedia = offer.socialMedia
  const hasAnyContact =
    !!offer.phone ||
    !!offer.email ||
    !!socialMedia?.website ||
    !!socialMedia?.facebook ||
    !!socialMedia?.instagram ||
    !!socialMedia?.tiktok ||
    !!socialMedia?.linkedin

  return (
    <InfoCardShell
      icon={Phone}
      title="Kontakt"
      description="Dane kontaktowe do klientów"
    >
      {hasAnyContact ? (
        <div className="flex flex-col gap-3">
          {offer.phone && (
            <a
              href={`tel:${offer.phone}`}
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <PhoneIcon className="size-4 shrink-0" />
              {offer.phone}
            </a>
          )}
          {offer.email && (
            <a
              href={`mailto:${offer.email}`}
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <MailIcon className="size-4 shrink-0" />
              {offer.email}
            </a>
          )}
          {socialMedia?.website && (
            <a
              href={socialMedia.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <GlobeIcon className="size-4 shrink-0" />
              Strona internetowa
            </a>
          )}
          {socialMedia?.facebook && (
            <a
              href={socialMedia.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <FaFacebook className="size-4 shrink-0" />
              Facebook
            </a>
          )}
          {socialMedia?.instagram && (
            <a
              href={socialMedia.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <FaInstagram className="size-4 shrink-0" />
              Instagram
            </a>
          )}
          {socialMedia?.tiktok && (
            <a
              href={socialMedia.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <FaTiktok className="size-4 shrink-0" />
              TikTok
            </a>
          )}
          {socialMedia?.linkedin && (
            <a
              href={socialMedia.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <FaLinkedin className="size-4 shrink-0" />
              LinkedIn
            </a>
          )}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Brak danych kontaktowych.</span>
      )}
    </InfoCardShell>
  )
}
```

Rationale: this is a straight port from `OfferDetailView.tsx` — same order, same icons, same empty state. The old inline block in `OfferDetailView.tsx` is removed in Task 10, not here, so both files momentarily have the same markup until the wiring swap.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/oferty/detail/ContactCard.tsx
git commit -m "feat(panel): ContactCard ported from OfferDetailView"
```

---

### Task 7: `LocationCard` — static map backdrop

**Files:**
- Create: `src/components/panel/oferty/detail/LocationCard.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/panel/oferty/detail/LocationCard.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { InfoCardShell } from './InfoCardShell'
import { buildStaticMapUrl } from './staticMapUrl'
import { cn } from '@/lib/utils'

interface LocationCardProps {
  address: string | null | undefined
  city: string | null | undefined
  lat: number | null | undefined
  lng: number | null | undefined
}

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export function LocationCard({ address, city, lat, lng }: LocationCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const mapUrl = buildStaticMapUrl({ lat, lng, apiKey: MAPS_API_KEY })
  const showMap = mapUrl !== null && !imageFailed

  // When the map backdrop renders we flip title + description colors to stay
  // legible against the dark image. Targets shadcn's data-slot attrs on
  // CardTitle / CardDescription so we don't have to thread className props
  // through InfoCardShell for every child.
  const mapOverrides = showMap
    ? '[&_[data-slot=card-title]]:text-white [&_[data-slot=card-description]]:text-white/75'
    : ''

  return (
    <InfoCardShell
      icon={MapPin}
      title="Lokalizacja"
      description="Skąd świadczysz usługi"
      className={cn('relative isolate', mapOverrides)}
    >
      {showMap && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
        >
          <img
            src={mapUrl!}
            alt=""
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        </div>
      )}
      {address ? (
        <div
          className={cn(
            'flex flex-col gap-0.5',
            showMap && 'text-white drop-shadow-md',
          )}
        >
          <span className="text-sm font-medium">{address}</span>
          {city && city !== address && (
            <span
              className={cn(
                'text-xs',
                showMap ? 'text-white/80' : 'text-muted-foreground',
              )}
            >
              {city}
            </span>
          )}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Brak lokalizacji</span>
      )}
    </InfoCardShell>
  )
}
```

Notes:
- The backdrop sits at `-z-10` inside a stacking context created by `isolate`, so it stays behind all card content without needing per-child `z-10` overrides.
- Arbitrary variants target shadcn v4's `data-slot="card-title"` / `data-slot="card-description"` — those attributes are set by the primitives in [src/components/ui/card.tsx](../../../src/components/ui/card.tsx), verify before relying on them.
- Icon chip keeps its accent-gold gradient over any backdrop; no override needed there.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/oferty/detail/LocationCard.tsx
git commit -m "feat(panel): LocationCard with static map backdrop"
```

---

### Task 8: `PriceCard` — animated count-up

**Files:**
- Create: `src/components/panel/oferty/detail/PriceCard.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/panel/oferty/detail/PriceCard.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { Banknote } from 'lucide-react'
import type { Offer } from '@/payload-types'
import { InfoCardShell } from './InfoCardShell'

interface PriceCardProps {
  hasPriceRange: Offer['hasPriceRange']
  price: Offer['price']
  priceFrom: Offer['priceFrom']
  priceTo: Offer['priceTo']
}

const SPRING = { stiffness: 80, damping: 20 }
const ZLOTY = (n: number) => n.toLocaleString('pl-PL')

function useCountUp(target: number | null | undefined, active: boolean) {
  const reduceMotion = useReducedMotion()
  const base = useMotionValue(0)
  const spring = useSpring(base, SPRING)
  const display = useTransform(spring, (v) => ZLOTY(Math.round(v)))

  useEffect(() => {
    if (target == null) return
    if (reduceMotion) {
      base.set(target)
      spring.set(target)
      return
    }
    if (active) base.set(target)
  }, [active, reduceMotion, target, base, spring])

  return display
}

export function PriceCard({ hasPriceRange, price, priceFrom, priceTo }: PriceCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  const singlePriceDisplay = useCountUp(price ?? null, inView)
  const fromDisplay = useCountUp(priceFrom ?? null, inView)
  const toDisplay = useCountUp(priceTo ?? null, inView)

  let body: React.ReactNode
  if (!hasPriceRange) {
    body =
      price != null ? (
        <span className="text-2xl font-semibold text-accent">
          <motion.span>{singlePriceDisplay}</motion.span> zł
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Cena do ustalenia</span>
      )
  } else if (priceFrom != null && priceTo != null && priceFrom !== priceTo) {
    body = (
      <span className="text-2xl font-semibold text-accent">
        <motion.span>{fromDisplay}</motion.span>
        <span className="mx-1 text-muted-foreground/80"> – </span>
        <motion.span>{toDisplay}</motion.span> zł
      </span>
    )
  } else if (priceFrom != null && priceTo != null) {
    body = (
      <span className="text-2xl font-semibold text-accent">
        <motion.span>{fromDisplay}</motion.span> zł
      </span>
    )
  } else if (priceFrom != null) {
    body = (
      <span className="text-2xl font-semibold text-accent">
        od <motion.span>{fromDisplay}</motion.span> zł
      </span>
    )
  } else if (priceTo != null) {
    body = (
      <span className="text-2xl font-semibold text-accent">
        do <motion.span>{toDisplay}</motion.span> zł
      </span>
    )
  } else {
    body = <span className="text-sm text-muted-foreground">Cena do ustalenia</span>
  }

  return (
    <InfoCardShell
      icon={Banknote}
      title="Cena"
      description="Cena lub zakres cenowy oferty"
    >
      <div ref={ref}>{body}</div>
    </InfoCardShell>
  )
}
```

Rationale: the display branches mirror `formatOfferPrice` so the final value is identical. The `useCountUp` hook is inlined here because it's only used by this card. Reduced-motion users get the final value immediately.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/oferty/detail/PriceCard.tsx
git commit -m "feat(panel): PriceCard with motion count-up"
```

---

### Task 9: `InfoCardGrid` — composition + AnimatedCard wrapping

**Files:**
- Create: `src/components/panel/oferty/detail/InfoCardGrid.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/panel/oferty/detail/InfoCardGrid.tsx`:

```tsx
import type { Offer } from '@/payload-types'
import { AnimatedCardGrid, AnimatedCard } from '@/components/panel/AnimatedCards'
import { CategoryCard } from './CategoryCard'
import { PriceCard } from './PriceCard'
import { LocationCard } from './LocationCard'
import { RadiusCard } from './RadiusCard'
import { DescriptionCard } from './DescriptionCard'
import { ContactCard } from './ContactCard'

interface InfoCardGridProps {
  offer: Offer
}

export function InfoCardGrid({ offer }: InfoCardGridProps) {
  const location = typeof offer.location === 'object' ? offer.location : null

  return (
    <AnimatedCardGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnimatedCard delay={0}>
        <CategoryCard categoryName={offer.categoryName} />
      </AnimatedCard>
      <AnimatedCard delay={0.05}>
        <PriceCard
          hasPriceRange={offer.hasPriceRange}
          price={offer.price}
          priceFrom={offer.priceFrom}
          priceTo={offer.priceTo}
        />
      </AnimatedCard>
      <AnimatedCard delay={0.1}>
        <LocationCard
          address={location?.address ?? null}
          city={location?.city ?? null}
          lat={location?.lat ?? null}
          lng={location?.lng ?? null}
        />
      </AnimatedCard>
      <AnimatedCard delay={0.15}>
        <RadiusCard radiusKm={location?.serviceRadius ?? null} />
      </AnimatedCard>
      <AnimatedCard delay={0.2} className="lg:col-span-2">
        <DescriptionCard shortDescription={offer.shortDescription} />
      </AnimatedCard>
      <AnimatedCard delay={0.25} className="lg:col-span-2">
        <ContactCard offer={offer} />
      </AnimatedCard>
    </AnimatedCardGrid>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit -p .`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/oferty/detail/InfoCardGrid.tsx
git commit -m "feat(panel): InfoCardGrid composing the six offer detail cards"
```

---

### Task 10: Wire `InfoCardGrid` into `OfferDetailView`

**Files:**
- Modify: `src/components/panel/oferty/OfferDetailView.tsx`

- [ ] **Step 1: Replace the inline info grid + contact card**

Open `src/components/panel/oferty/OfferDetailView.tsx`. Locate:

1. **The info grid** — the `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">` block containing the four Kategoria / Cena / Lokalizacja / Zasięg cards.
2. **The description card** — the `<Card>` titled `"Opis"` with the `shortDescription` and "Pełny opis dostępny na stronie oferty" line.
3. **The contact card** — the `<Card>` titled `"Kontakt"` with phone / email / website / facebook / instagram / tiktok / linkedin links and the "Brak danych kontaktowych." empty state.

Replace all three blocks with a single line:

```tsx
<InfoCardGrid offer={offer} />
```

At the top of the file, replace the current grid-only imports with the new grid import and drop anything only used by the removed blocks. Keep `OfferStatusToggle`, `DeleteOfferButton`, `Offer`, `Image`, `Link`, `Button`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`, `Badge`, and the lucide icons used by the remaining hero/media sections (`PencilIcon`, `ExternalLinkIcon`). Remove `PhoneIcon`, `MailIcon`, `GlobeIcon`, and the `FaFacebook`/`FaInstagram`/`FaTiktok`/`FaLinkedin` imports — they were only used by the inline contact card. Also remove the `priceDisplay` / `hasAnyPrice` locals used only by the inline info grid.

Add:

```tsx
import { InfoCardGrid } from '@/components/panel/oferty/detail/InfoCardGrid'
```

Also delete the now-unused `socialMedia` destructure near the top of the component body.

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm exec tsc --noEmit -p .`
Expected: No new errors. No leftover `'X' is declared but never read` diagnostics introduced by this task (pre-existing ones elsewhere are OK).

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/oferty/OfferDetailView.tsx
git commit -m "refactor(panel): use InfoCardGrid on offer detail page"
```

---

### Task 11: Manual QA

**Files:** none. Run the dev server and exercise the page.

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

Wait for the "Ready" line. If the server is already running from your current session, skip this step.

- [ ] **Step 2: Load a populated offer**

Open `http://localhost:3000/pl/panel/oferty/<slug>` for an offer that has a price, coordinates, a short description, phone, email, and at least one social link. "dj-test" from earlier sessions is a good candidate if it still exists; otherwise create a fresh offer through the wizard.

Verify:
- All six cards share the same header treatment (icon chip + title + description).
- Price animates from 0 up to the target once, on first view. Scroll away and back — no re-animation.
- Location card shows a dark static map behind the address; address is readable.
- Radius card shows the dashed ring with the compass icon.
- Description card shows the italic quote + "Pełny opis dostępny…" line.
- Contact card shows each contact row in the correct order.
- Hovering any card lifts it slightly and tints the border accent-gold — same as `/panel/oferty` list.

- [ ] **Step 3: Graceful-fallback checks**

Verify the following degrade cleanly:
- **Offer with no `priceFrom`/`priceTo`/`price`** → "Cena do ustalenia".
- **Offer with only `priceFrom`** → "od X zł" with the single number animating.
- **Offer without coordinates** (older entry) → location card has the plain header/body with no map backdrop.
- **Empty `shortDescription`** → "Brak krótkiego opisu".
- **Offer with zero socials and no phone/email** → "Brak danych kontaktowych." (unlikely but possible).

Temporarily simulate the "map API fails" case by editing `.env.local` to set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=` (empty) and reloading — the location card should render without the image backdrop. Restore the key after verification.

- [ ] **Step 4: Reduced-motion check**

In the browser DevTools emulation, toggle `prefers-reduced-motion: reduce`. Reload the page. Verify:
- Price shows its final value instantly with no count-up.
- Card entrance animations collapse to a fade (`AnimatedCard` already handles this via motion/react).

- [ ] **Step 5: Mobile width check**

Resize to < 640px. Cards should stack to a single column. At `sm` (640px), 2 columns. At `lg` (1024px), the 4+2 layout appears.

- [ ] **Step 6: Push branch**

```bash
git push
```

---

## Post-plan notes

- **No DB migration** — the plan only adds components, a helper, and a test.
- **No new deps** — `motion/react`, `lucide-react`, `react-icons/fa6`, and the Maps key are already in the project.
- **Key exposure** — the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is already public via the Maps JS loader; the static-map image URL adds no new surface area. HTTP-referer restrictions on the key in GCP remain the real protection.
- **Skill loading for future sessions** — when touching these files next, load `eventizer-panel-conventions` and `eventizer-design-tokens` for context.
