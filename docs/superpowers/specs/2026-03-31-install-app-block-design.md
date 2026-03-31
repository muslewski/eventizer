# Install App Block — Design Spec

## Overview

A new CMS-managed Payload block that prompts visitors to add Eventizer to their home screen. On mobile, it shows a premium card with a phone mockup and platform-specific install buttons (iPhone/Android) that open a dialog with step-by-step instructions. On desktop, it shows a QR code for users to scan with their phone. The block hides itself when the app is already running in standalone mode (already installed).

## Decisions

| Decision | Choice |
|----------|--------|
| Target audience | All mobile visitors |
| Placement | CMS block in Payload (like other blocks) |
| Visual style | Card with phone mockup (premium) |
| Action buttons | Apple + Android icons, open platform-specific dialog |
| Dialog content | Text-only numbered steps |
| Standalone detection | Hide block when already installed |
| Desktop behavior | Show QR code to scan on phone |
| Implementation approach | Fully client-side detection |
| Default language for field values | Polish (PL) — Payload fallback language |

## File Structure

```
/src/blocks/InstallApp/
├── config.ts              # Payload block config (slug: 'installApp')
├── Component.tsx          # Server component (thin pass-through)
└── Component.client.tsx   # Client component (all logic)
```

**Existing files to modify:**
- `/src/blocks/RenderBlocks.tsx` — add `installApp: InstallAppBlock` to block component map
- `/src/collections/Pages/index.ts` — add `InstallApp` config to the blocks array
- `package.json` — add `qrcode.react` dependency

## Payload Block Config

Slug: `installApp`
Interface name: `InstallAppBlock`

### Fields

All text fields use `localized: true`. Defaults are in Polish (PL fallback language).

| Field | Type | Localized | Default (PL) |
|-------|------|-----------|-------------|
| `label` | text | yes | "Aplikacja mobilna" |
| `heading` | text | yes | "Twoje wydarzenia, jedno dotknięcie" |
| `description` | text | yes | "Zainstaluj Eventizer na telefonie, by mieć natychmiastowy dostęp. Bez app store." |
| `iosButtonLabel` | text | yes | "iPhone" |
| `androidButtonLabel` | text | yes | "Android" |
| `qrLabel` | text | yes | "Aplikacja mobilna" |
| `qrHeading` | text | yes | "Pobierz aplikację na telefon" |
| `qrDescription` | text | yes | "Zeskanuj kod QR aparatem telefonu, aby zainstalować Eventizer." |
| `iosDialogTitle` | text | yes | "Zainstaluj na iPhonie" |
| `iosSteps` | array (text child) | yes (whole array per locale) | 3 default steps (see below) |
| `androidDialogTitle` | text | yes | "Zainstaluj na Androidzie" |
| `androidSteps` | array (text child) | yes (whole array per locale) | 3 default steps (see below) |
| `doneMessage` | text | yes | "To wszystko! Eventizer pojawi się na ekranie głównym." |

**Default iOS steps (PL):**
1. "Kliknij przycisk Udostępnij (⬆) na dole Safari"
2. "Przewiń w dół i kliknij \"Dodaj do ekranu głównego\""
3. "Kliknij \"Dodaj\" w prawym górnym rogu"

**Default Android steps (PL):**
1. "Kliknij przycisk menu (⋮) w prawym górnym rogu przeglądarki"
2. "Kliknij \"Dodaj do ekranu głównego\" lub \"Zainstaluj aplikację\""
3. "Kliknij \"Dodaj\", aby potwierdzić"

All fields have `admin.description` with `en`/`pl` labels explaining their purpose to editors.

## Component Architecture

### Server Component (`Component.tsx`)

Simple pass-through, no async data fetching:

```typescript
export const InstallAppBlock: React.FC<
  InstallAppBlockProps & { id?: string | number; className?: string }
> = (props) => {
  return <InstallAppClient {...props} />
}
```

### Client Component (`Component.client.tsx`)

`'use client'` directive. Manages all logic:

**State:**
```typescript
{ platform: 'ios' | 'android' | 'desktop', isStandalone: boolean, isReady: boolean }
```

**Detection logic (runs in `useEffect` on mount):**
1. Check `window.matchMedia('(display-mode: standalone)')` — if true, set `isStandalone = true`, block returns `null`
2. Check `navigator.userAgent`:
   - Contains `iPad` or `iPhone` or `iPod` → `platform = 'ios'`
   - Contains `Android` → `platform = 'android'`
   - Otherwise → `platform = 'desktop'`
3. Set `isReady = true` to trigger render

**Rendering rules:**

| Platform | Standalone | Renders |
|----------|-----------|---------|
| ios | no | Phone mockup card + iOS/Android buttons |
| android | no | Phone mockup card + iOS/Android buttons |
| desktop | no | QR code card |
| any | yes | Nothing (return null) |

Before `isReady = true`, the component returns `null` (no SSR flash).

## Mobile View

Dark gradient card with two columns (stacks vertically on small screens):

**Left column:** Phone wireframe mockup with Eventizer logo and placeholder content lines.

**Right column:**
- CMS `label` (small uppercase)
- CMS `heading` (large, bold)
- CMS `description` (muted text)
- Two buttons:
  - Current platform → primary style (white filled)
  - Other platform → secondary style (outline)
  - Both always visible (user might share instructions)

**Animation:** `motion/react` `whileInView` fade-up entrance, matching existing block patterns (`viewport: { once: true, margin: '-60px' }`).

## Desktop View

Same dark gradient card style, swaps phone mockup for QR code:

**Left column:** QR code rendered via `qrcode.react` (encodes the current page URL, white on transparent).

**Right column:**
- CMS `qrLabel` (small uppercase)
- CMS `qrHeading`
- CMS `qrDescription`

No platform buttons on desktop.

## Instruction Dialog

Opens when user taps "iPhone" or "Android" button. Uses existing shadcn `Dialog` component from `/src/components/ui/dialog.tsx`.

**Structure:**
- `DialogHeader` with `DialogTitle` → CMS `iosDialogTitle` or `androidDialogTitle`
- Numbered steps from CMS `iosSteps` or `androidSteps` array
  - Each step: styled number circle + step text
- CMS `doneMessage` as closing text at the bottom
- Close button via `DialogClose`

## Integration Checklist

1. Create `/src/blocks/InstallApp/config.ts` with block definition
2. Create `/src/blocks/InstallApp/Component.tsx` (server wrapper)
3. Create `/src/blocks/InstallApp/Component.client.tsx` (client logic)
4. Add `installApp: InstallAppBlock` to `/src/blocks/RenderBlocks.tsx`
5. Add `InstallApp` to blocks array in `/src/collections/Pages/index.ts`
6. Install `qrcode.react` dependency
7. Run Payload type generation to get `InstallAppBlock` TypeScript interface

## Dependencies

- **New:** `qrcode.react` (QR code rendering for desktop view)
- **Existing:** `motion/react`, `lucide-react`, shadcn `Dialog`, Radix UI primitives

## Out of Scope

- Service worker / offline support (existing manifest is sufficient for Add to Home Screen)
- Push notifications
- Native app store links
- Analytics/tracking of install conversions
- Dismissible state (no "don't show again" — block is always visible when conditions are met)
