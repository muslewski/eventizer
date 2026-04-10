# Custom Panel UI — Migration from Payload Admin

**Date:** 2026-04-10
**Status:** Approved
**Approach:** Server-First (RSC + Server Actions + Payload Local API)

---

## Overview

Migrate the service provider (and client) experience from Payload's admin panel (`/app`) to a custom shadcn-based panel (`/panel`). Payload remains the content management backend — the panel is a new UI layer that queries and mutates data via Payload's Local API through server actions.

### Goals

- Professional, responsive panel UI matching the Eventizer frontend design language
- shadcn components, Tailwind CSS vars, Lucide icons, Framer Motion where beneficial
- Service providers get full offer management; clients get a lightweight experience
- No transactions or direct messaging — display and management only
- Polish language first, English support later
- Existing `/app` (Payload admin) stays untouched; auth pages continue redirecting to `/app` until the panel is accepted

### Non-Goals

- Replacing Payload admin for admins/moderators (they keep using `/app`)
- Order/transaction handling
- Direct client-to-provider communication
- English i18n (deferred)

---

## Architecture

### Route Structure

The panel lives inside `(frontend)/[lang]/panel/` to inherit the existing root layout (ThemeProvider, RootAuthProvider, Bebas Neue + Montserrat fonts, Header, Footer).

```
src/app/(frontend)/[lang]/panel/
  layout.tsx                          → Auth guard + PanelShell (sidebar + content area)
  dashboard/
    page.tsx                          → Role-aware dashboard (different widgets per role)
  oferty/
    page.tsx                          → Offer list (service-provider only)
    [slug]/
      page.tsx                        → Single offer detail/management
      edytuj/
        page.tsx                      → Edit wizard (reuses shared form)
    nowa/
      page.tsx                        → Creation wizard (reuses shared form)
  plan-subskrypcji/
    page.tsx                          → Subscription status + onboarding flow
  formularze/
    page.tsx                          → Submitted forms (service-provider only)
  pomoc/
    page.tsx                          → Help tickets (both roles)
  konto/
    page.tsx                          → Account settings (both roles)
  ulubione/
    page.tsx                          → Favorite offers (client-focused)
```

### Auth Guard

`panel/layout.tsx` is a server component that:

1. Calls `getRootAuthUser()` to check Better Auth session
2. If not authenticated → `redirect('/auth/sign-in')`
3. If authenticated → fetches full Payload user (with role, subscription data)
4. Renders `<PanelShell user={user}>` passing user data and role

Role-based page access is handled at the page level — pages like `/oferty` and `/oferty/nowa` check role server-side and redirect clients away. No separate route groups for roles.

### Layout Hierarchy

```
(frontend)/[lang]/layout.tsx          → ThemeProvider, RootAuthProvider, Header, Footer
  └─ panel/layout.tsx                 → Auth guard, PanelShell (shadcn Sidebar + content area)
      └─ dashboard/page.tsx           → Page content renders inside the shell
```

The panel inherits Header and Footer from the frontend layout. The PanelShell adds a shadcn Sidebar component as a nested layout.

---

## Sidebar Navigation

Uses **shadcn's Sidebar component** which provides:

- **Desktop (lg+):** collapsible sidebar (full 240px or icon-only mode)
- **Mobile (below lg):** Sheet/drawer triggered by hamburger icon

### Service Provider Nav Items

| Label | Icon (Lucide) | Route |
|-------|---------------|-------|
| Dashboard | `LayoutDashboard` | `/panel/dashboard` |
| Oferty | `FileText` | `/panel/oferty` |
| Plan subskrypcji | `CreditCard` | `/panel/plan-subskrypcji` |
| Formularze | `Inbox` | `/panel/formularze` |
| Pomoc | `HelpCircle` | `/panel/pomoc` |
| Konto | `Settings` | `/panel/konto` |

**Conditional:** If service provider has exactly 1 offer, "Oferty" label changes to "Zarządzaj ofertą" and links directly to `/panel/oferty/[slug]`.

### Client Nav Items

| Label | Icon (Lucide) | Route |
|-------|---------------|-------|
| Dashboard | `LayoutDashboard` | `/panel/dashboard` |
| Ulubione | `Heart` | `/panel/ulubione` |
| Pomoc | `HelpCircle` | `/panel/pomoc` |
| Zostań usługodawcą | `Star` | `/panel/plan-subskrypcji` |
| Konto | `Settings` | `/panel/konto` |

### Sidebar Design

- Role badge at the top (e.g., "★ Usługodawca" with brand gold accent)
- Active nav item: `bg-stone-900` with `text-foreground`
- Inactive: `text-muted-foreground`
- Konto pinned at the bottom, separated by a border
- Follows Eventizer dark theme: `bg-background` with `border-border` dividers

---

## Pages

### Dashboard (`/panel/dashboard`)

Single page component, renders different widgets based on role.

**Service Provider widgets:**

- **Aktywne oferty** — count vs `maxOffers` (e.g., "3 z 5"), "Dodaj ofertę" quick action
- **Wyświetlenia** — placeholder widget for future analytics (no views tracking exists yet; display offer count or hide until analytics is added)
- **Nowe formularze** — unread `submitted-forms` count, link to `/panel/formularze`
- **Status subskrypcji** — plan name, renewal date, link to `/panel/plan-subskrypcji`

Quick actions:
- "Dodaj nową ofertę" button (disabled if at limit)
- "Edytuj ofertę" shortcut (if single offer)
- Recent activity feed (latest form submissions, offer status changes)

Alerts/banners:
- Subscription expiring soon
- Offer limit reached
- Draft offers reminder

**Client widgets:**

- **Ulubione oferty** — count + recent favorites (3-4 compact cards)
- **Zgłoszenia pomocy** — open help tickets count
- "Zostań usługodawcą" prominent CTA card
- Quick links to browse categories on frontend

### Offers List (`/panel/oferty`)

Service-provider only. Redirects clients to `/panel/dashboard`.

- Grid/list of offer cards: main image thumbnail, title, status badge (Opublikowana / Robocza), category, price, quick actions (edit, preview, toggle status)
- "Dodaj ofertę" button at top (disabled with tooltip if at limit)
- Filter/sort by status (all, published, draft)
- If user has single offer → sidebar links directly to that offer's detail page

### Single Offer Detail (`/panel/oferty/[slug]`)

Read-only management view of the offer's current state:

- Hero area: main image + title + status badge
- Key info cards: category, price, location, service radius
- Description preview (rendered rich text)
- Media gallery preview
- Contact info and social media links
- Action buttons: "Edytuj" (→ wizard), "Podgląd na stronie" (→ frontend), "Zmień status" (publish/unpublish)

### Offer Wizard (`/panel/oferty/nowa` and `/panel/oferty/[slug]/edytuj`)

Both routes render the same `OfferWizardForm` client component. Edit mode pre-populates with existing data.

**5 steps:**

1. **Podstawowe informacje** — title (with character counter), category (hierarchical picker, 3 levels), short description (textarea)
2. **Cennik i lokalizacja** — price / price range toggle (`hasPriceRange` checkbox), price fields, location picker (Google Places, reusing existing component), service radius (km slider/input, 1-500)
3. **Media** — main image upload (required), gallery images (array), video upload with aspect ratio selector (16:9, 9:16, 1:1), background image (optional)
4. **Opis i kontakt** — rich text description (Lexical editor, reusing `offerLexical` config), phone, email, social media links (facebook, instagram, tiktok, linkedin)
5. **Podsumowanie** — review all fields in read-only preview, offer card preview, "Opublikuj" or "Zapisz jako roboczą" buttons

**Form architecture:**
- Single react-hook-form instance with Zod schema spanning all steps
- Each step validates its own fields before allowing "Dalej"
- Step indicator/progress bar at the top
- "Wstecz" / "Dalej" navigation buttons
- Server action on final submit calls Payload Local API (`payload.create` or `payload.update`)
- All existing Payload hooks fire automatically (enforceMaxOffers, validateCategory, populateCategoryData, revalidateOffer)

### Subscription & Onboarding (`/panel/plan-subskrypcji`)

Three states rendered from the same page:

**State 1 — First-time onboarding** (client wanting to become service provider):
- Step 1: **Wybierz kategorię** — hierarchical category picker using `service-categories` collection (depth 2). Card-based selection.
- Step 2: **Wybierz plan** — subscription plan cards from `subscription-plans` collection. Shows: name, price, features with included/excluded checkmarks, "Najpopularniejszy" badge on highlighted plan. Beta option if `BETA_MODE=true`.
- Submit → Stripe Checkout redirect. Stripe webhook (`checkout.session.completed`) handles role promotion to service-provider.

**State 2 — Active subscription** (existing service provider):
- Current plan card: plan name, category, renewal date, status
- "Zmień plan" → re-enters plan selection
- "Zmień kategorię" → re-enters category selection
- "Zarządzaj płatnościami" → Stripe Customer Portal or cancellation info

**State 3 — Subscription expired:**
- Banner explaining subscription expired, offers are drafted
- "Odnów subskrypcję" CTA → renew flow (same 2 steps as onboarding)

### Formularze (`/panel/formularze`)

Service-provider only.

- List of `submitted-forms` filtered by `provider` field matching current user
- Each entry: sender name, email, type badge (zamówienie / pytanie / problem), status badge (nowe / przeczytane / odpowiedziane), linked offer title, date
- Click to expand/view full message
- Status update actions (mark as read/replied)
- Sorted by newest first

### Pomoc (`/panel/pomoc`)

Both roles.

- List of user's `help-tickets` with status badges (Otwarte / Rozwiązane)
- "Nowe zgłoszenie" button → form (title, email pre-filled from user, description)
- Submits via server action to `help-tickets` collection
- Card list sorted by newest first

### Konto (`/panel/konto`)

Both roles.

- Profile section: name, email (read-only), profile picture upload (reusing `ProfilePictures` collection)
- Password change (reusing existing logic)
- Subscription info summary for service providers (links to `/panel/plan-subskrypcji`)
- Role display
- "Wyloguj się" button

### Ulubione (`/panel/ulubione`)

Client-focused (accessible to both roles).

- Grid of favorited offer cards (compact panel version of `OfferListCard`)
- Toggle favorite (heart icon) to remove
- Links to offer detail on frontend

---

## Data Layer

### Server Actions (`src/actions/panel/`)

| Action | Purpose | Payload API Call |
|--------|---------|-----------------|
| `getOffers(userId)` | Fetch user's offers | `payload.find({ collection: 'offers', where: { user: { equals: userId } } })` |
| `getOffer(slug, userId)` | Single offer with ownership check | `payload.find({ collection: 'offers', where: { link: { equals: slug }, user: { equals: userId } } })` |
| `createOffer(data)` | Create new offer | `payload.create({ collection: 'offers', data })` |
| `updateOffer(id, data)` | Update existing offer | `payload.update({ collection: 'offers', id, data })` |
| `toggleOfferStatus(id)` | Publish/unpublish | `payload.update({ collection: 'offers', id, data: { _status } })` |
| `getSubmittedForms(providerId)` | Forms for this provider | `payload.find({ collection: 'submitted-forms', where: { provider: { equals: providerId } } })` |
| `updateFormStatus(id, status)` | Mark form as read/replied | `payload.update({ collection: 'submitted-forms', id, data: { status } })` |
| `getHelpTickets(userId)` | User's help tickets | `payload.find({ collection: 'help-tickets', where: { user: { equals: userId } } })` |
| `createHelpTicket(data)` | Submit new ticket | `payload.create({ collection: 'help-tickets', data })` |
| `updateAccount(data)` | Profile updates | `payload.update({ collection: 'users', id, data })` |
| `getDashboardStats(userId, role)` | Aggregated dashboard stats | Multiple Payload queries aggregated |
| `toggleFavorite(userId, offerId)` | Add/remove favorite | `payload.update({ collection: 'users', id, data: { favorites } })` |

All server actions reuse existing Payload hooks and access control — enforceMaxOffers, validateCategory, populateCategoryData, revalidateOffer all fire automatically through the Local API.

### Schema Changes

**Users collection** — add one field:

```typescript
{
  name: 'favorites',
  type: 'relationship',
  relationTo: 'offers',
  hasMany: true,
  defaultValue: [],
  access: {
    update: roleOrHigherOrSelf('client', 'id'),
  },
}
```

No other collection changes needed.

### Shared Components (`src/components/panel/`)

| Component | Purpose |
|-----------|---------|
| `PanelShell` | shadcn Sidebar + SidebarProvider + content wrapper |
| `PanelNav` | Role-aware navigation items with Lucide icons |
| `OfferWizardForm` | Multi-step form (react-hook-form + Zod), shared by create and edit |
| `WizardStep` | Individual step wrapper with validation gate |
| `StepIndicator` | Wizard progress bar |
| `OfferCard` | Compact offer card for list/grid views in panel |
| `StatCard` | Dashboard widget card |
| `StatusBadge` | Reusable status badge (published/draft/active/expired/etc.) |

### Reused Existing Components

- Category picker logic from `serviceProviderOnboarding`
- Location picker from `payload/fields/locationPicker`
- Character counter from `payload/fields/titleCharCounter`
- Lexical rich text editor config (`offerLexical`)
- Profile picture upload logic from `ProfilePictures` collection
- Password change logic from `payload/fields/changePassword`
- Subscription details fetching from `actions/stripe/getCurrentSubscriptionDetails`
- Offer categories fetching from `actions/getOfferCategories`

---

## Design System Alignment

The panel uses the same design tokens as the frontend:

- **Colors:** CSS variables (`--background`, `--foreground`, `--accent`, `--border`, `--card`, etc.)
- **Fonts:** Bebas Neue for headings (via `font-bebas`), Montserrat for body (via `font-montserrat`)
- **Dark mode:** Inherits from ThemeProvider (`next-themes`)
- **Rounded corners:** `rounded-xl` for cards, `rounded-md` for smaller elements
- **Borders:** `border-border/30` to `border-border/50` for subtle separation
- **Glass morphism:** `bg-white/10 backdrop-blur-sm` where appropriate
- **Brand accent:** Copper/gold (`rgb(210, 140, 8)`) for highlights, badges, active states
- **Shadows:** Minimal, relying on borders and subtle background differences
- **Spacing:** `px-4 sm:px-8 lg:px-16` responsive padding scale
- **Animations:** Framer Motion for page transitions and subtle interactions where beneficial, respecting `reduce-motion` preference

### shadcn Components to Install

Already installed: Button, Card, Dialog, Drawer, DropdownMenu, Input, Label, Select, Tabs, Tooltip, Avatar, Badge, Skeleton, Sonner, ScrollArea, Separator, Form (react-hook-form)

**Need to install:**
- `Sidebar` — panel navigation
- `Sheet` — mobile sidebar (used by Sidebar internally)
- `Table` — formularze and help tickets lists
- `Progress` — wizard step indicator
- `Switch` — toggles (e.g., price range, publish/draft)
- `Slider` — service radius picker
- `Breadcrumb` — offer detail / edit navigation context
