# Eventizer

Polish event-services marketplace (https://eventizer.pl) — Next.js 16 + Payload 3.75 + Better Auth + Stripe.

**Agents & contributors: orient via the Mind first** — `eventizer-mind/map/index.md` is the verified
map of every zone; the root `CLAUDE.md` carries the dev rule. Package manager: **pnpm**.

---

## Stack

Next.js 16 (App Router, Turbopack) · Payload CMS 3.75 · **Vercel Postgres** (Drizzle adapter) ·
Better Auth (email/password + Google/Facebook) · Stripe subscriptions · Vercel Blob uploads ·
Resend email · shadcn/ui + Tailwind 4 · Motion · AI SDK (OpenAI) for offer-content generation.

## Quick start

```bash
pnpm install
cp .env.example .env        # fill in the values — see comments in the file
docker compose up -d        # local Postgres on :5432 (or point POSTGRES_URL at Vercel Postgres)
pnpm payload migrate        # apply database migrations
pnpm dev                    # http://localhost:3000  (admin: /admin)
```

The production build (`pnpm build`) normalizes migration state via
`scripts/prepare-migrations.mjs`, runs `payload migrate`, then `next build --turbopack`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint (CI gate — errors fail) |
| `pnpm typecheck` | `tsc --noEmit` (CI gate) |
| `pnpm test:int` | Vitest integration tests — no DB needed; DB-backed suites skip without `POSTGRES_URL` |
| `pnpm test:e2e` | Playwright — expects the dev server (`pnpm dev`) to be reachable |
| `pnpm test` | int + e2e |
| `pnpm mind:check` | Validate + regenerate the Mind index (CI gate) |
| `pnpm generate:types` | Regenerate `payload-types.ts` after schema changes |

CI (`.github/workflows/ci.yml`) runs lint → typecheck → test:int → mind:check on every PR.

## Project layout

| Path | Contents |
| --- | --- |
| `src/app/(frontend)/[lang]/` | Public site + provider panel (`/panel`), Polish route segments |
| `src/app/(payload)/` | Payload admin |
| `src/collections/` | Payload collections (Offers, Users, Pages, uploads…) |
| `src/blocks/` | CMS page blocks rendered by `RenderBlocks` |
| `src/actions/` | Server actions (`panel/`, `stripe/`, `user/`) |
| `src/access/` | Role-hierarchy access-control factories |
| `src/plugins/` | Blob storage, SEO, and Stripe webhook handlers |
| `eventizer-mind/` | The Mind: verified zone map, decisions, specs, tech-debt |

## Database & migrations

Payload runs on **Vercel Postgres** (`POSTGRES_URL`). After changing any collection schema:
`pnpm generate:types`, create a migration (`pnpm payload migrate:create`), and commit both —
see the `eventizer-payload-migrations` skill / `eventizer-mind/map/zones/offers-data.md` for the
full procedure and the Vercel-build failure modes it prevents.
