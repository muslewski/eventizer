// Regenerates the static default Open Graph image at `public/og-image.png`.
//
// Why this exists: social crawlers (facebookexternalhit — which powers
// Instagram/Facebook/WhatsApp link previews — plus iMessage, Slack, Discord,
// LinkedIn, X) render WebP og:images unreliably, and a missing file yields no
// preview at all. This ships a real, crawler-safe PNG so any page without its
// own SEO image (the homepage included) still gets a branded preview card.
//
// Run: `node scripts/og/generate-default-og.mjs`
// Output: 1200x630 PNG (the size every crawler expects) — keep it committed.

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

const WIDTH = 1200
const HEIGHT = 630
const BG = 'rgb(11, 11, 11)' // --color-base-900 — the dark theme background
const COPPER = 'rgb(210, 140, 8)' // active copper-gold brand accent (brand-500)

// The "-dark" variant is the one designed for dark backgrounds (light artwork),
// mirroring how the app shows it under `dark:` — see beforeNav/customLogo.
const logoPath = path.join(repoRoot, 'src/assets/eventizer-logo-1-dark.png')
const outPath = path.join(repoRoot, 'public/og-image.png')

const background = Buffer.from(
  `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="50%" cy="42%" r="62%">
        <stop offset="0%" stop-color="${COPPER}" stop-opacity="0.18" />
        <stop offset="55%" stop-color="${COPPER}" stop-opacity="0.04" />
        <stop offset="100%" stop-color="${BG}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}" />
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)" />
    <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="${COPPER}" />
  </svg>`,
)

// Bounding box for the logo — fit inside so it never exceeds the canvas
// regardless of the source artwork's aspect ratio.
const LOGO_BOX_WIDTH = 720
const LOGO_BOX_HEIGHT = 420

const logo = await sharp(logoPath)
  .resize({
    width: LOGO_BOX_WIDTH,
    height: LOGO_BOX_HEIGHT,
    fit: 'inside',
    withoutEnlargement: true,
  })
  .toBuffer({ resolveWithObject: true })

const left = Math.round((WIDTH - logo.info.width) / 2)
const top = Math.round((HEIGHT - logo.info.height) / 2) - 12

await sharp(background)
  .composite([{ input: logo.data, left, top }])
  .png()
  .toFile(outPath)

console.log(`Wrote ${path.relative(repoRoot, outPath)} (${WIDTH}x${HEIGHT})`)
