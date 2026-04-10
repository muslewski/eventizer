---
name: eventizer-architecture
description: Use when working on the Eventizer project — provides project vision, design philosophy, architecture, and key technical decisions. Load this for context before making design, UX, or architectural choices in the Eventizer codebase.
---

# Eventizer — Project Context

## What It Is

Eventizer is a **Polish event services marketplace** connecting service providers (DJs, photographers, decorators, caterers, venues, planners) with clients organizing events. It simplifies discovering, comparing, and contacting event professionals — replacing the fragmented process of scrolling, calling, and comparing on your own.

**Tagline:** "Łączymy ludzi z pasją do tworzenia niezapomnianych chwil"
**URL:** https://eventizer.pl

## Vision & Values

**Mission:** Every moment deserves exceptional presentation. The best events start from easy access to verified professionals.

Three core values drive all decisions:

1. **Prostota** — One place, clear catalog, smart search. Find the right offer in minutes, not hours.
2. **Transparentność** — Clear prices, real reviews, verified profiles. No hidden costs.
3. **Dostępność** — Every service provider, regardless of size, gets a fair chance to reach clients. Level the playing field.

## Business Model

- **Service providers** pay a subscription (Stripe) to list offers. Plans are tiered by category access and offer limits.
- **Clients** browse and contact providers for free. No transaction fees — Eventizer facilitates discovery, not payments.
- **Currently in free beta** — providers can list offers at no cost.

## Design Philosophy

- **Dark theme by default** — evokes the nighttime event/party atmosphere
- **Copper/gold brand accent** (`rgb(210, 140, 8)`) — luxury and premium feel
- **Bebas Neue** for headlines — bold, impactful, event-poster energy
- **Montserrat** for body text — clean, modern readability
- **Glass morphism and subtle gradients** — depth without heaviness
- **Framer Motion animations** — polished but respectful of reduce-motion preferences
- **shadcn/ui (new-york style, stone base)** — standardized, accessible components
- **Responsive-first** — mobile experience is a priority (PWA installable)

The frontend should feel like a high-end event invitation, not a generic SaaS dashboard.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router, Turbopack) | Modern RSC, server actions, great DX |
| CMS | Payload CMS 3.75 | Content management, collections, admin panel, hooks |
| Auth | Better Auth 1.4 | OAuth (Google, Facebook) + email/password, flexible |
| Database | Vercel Postgres + Drizzle ORM | Managed, serverless-friendly |
| Payments | Stripe | Subscriptions, webhooks, customer portal |
| Storage | Vercel Blob | Image/video uploads with prefix organization |
| Email | Resend | Transactional emails (verification, password reset) |
| UI | shadcn/ui + Radix UI | Accessible, composable, themeable |
| Styling | Tailwind CSS v4 (PostCSS) | Utility-first, CSS variables for theming |
| Animation | Motion (Framer Motion) | Polished interactions |
| Icons | Lucide React | Consistent icon set |
| Language | TypeScript | Type safety throughout |

## Architecture

### Route Structure

```
src/app/
  (frontend)/[lang]/     → Public site (Polish/English), Header + Footer layout
    auth/                 → Better Auth sign-in/up pages
    ogloszenia/           → Public offer listings and detail pages
    panel/                → Custom panel UI (shadcn-based, auth-protected)
    [slug]/               → CMS pages
  (payload)/app/          → Payload admin panel at /app (admins/moderators only)
  api/                    → API routes (Better Auth, video processing)
```

### Key Patterns

- **Server Components + Payload Local API** for data fetching (no HTTP round-trip)
- **Server Actions** for mutations (create/update offers, forms, tickets)
- **Better Auth** handles sessions; Payload Users collection syncs via custom auth strategy
- **Payload hooks** enforce business logic (offer limits, category validation, cache revalidation)
- **Stripe webhooks** handle role transitions (client → service-provider on subscription, revert on cancellation)

### Role Hierarchy

```
admin → moderator → service-provider
                  → client
```

Access control uses factory functions: `roleOrHigher()`, `roleOrHigherOrSelf()`, `providerOrHigher()`.

### Key Collections

- **Users** — roles, subscription info, profile, favorites
- **Offers** — title, category, price, location, media, description, socials (drafts + published)
- **Service Categories** — 3-level hierarchy with icons and plan requirements
- **Subscription Plans** — Stripe-synced tiers with features
- **Submitted Forms** — client inquiries to providers (order/question/problem)
- **Help Tickets** — user support requests
- **Upload collections** — Media, ProfilePictures, OfferUploads, OfferVideoUploads

### Service Categories

9 top-level categories with subcategories (up to 3 levels):
Muzyka i rozrywka, Foto i wideo, Miejsce wydarzenia, Organizacja i planowanie, Dekoracje i florystyka, Catering i Napoje, Technika, Beauty, Wynajem aut.

## Language

- Polish is the primary language. All UI labels, page content, and user-facing text are in Polish.
- English support is planned but deferred.
- Payload i18n supports both `pl` and `en` locales.
