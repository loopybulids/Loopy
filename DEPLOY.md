# Deploying Loopy

Loopy is a monorepo with two apps:

| App | Stack | Where it deploys |
| --- | --- | --- |
| `frontend/` | Next.js 14 (App Router) | **Vercel** ✅ |
| `backend/`  | NestJS + Prisma | A long-running host (Render / Railway / Fly) — **not** Vercel |

> **Why not the backend on Vercel?** Vercel runs serverless functions with an
> ephemeral, read-only filesystem. The backend is a stateful NestJS server that
> currently uses **SQLite** (`file:./dev.db`), which needs a persistent disk.
> Host it on a platform that runs a real Node process + a managed database.
> Then point the frontend at it via `NEXT_PUBLIC_API_URL`.

---

## 1. Deploy the frontend to Vercel

1. Push this repo to GitHub (see below) and **Import** it in Vercel.
2. In the import screen, set **Root Directory** to `frontend`.
   Vercel auto-detects Next.js — the build (`next build`) and output settings
   come from `frontend/vercel.json`.
3. Add an **Environment Variable**:
   - `NEXT_PUBLIC_API_URL` = the public URL of your backend, ending in `/api/v1`
     (e.g. `https://loopy-api.onrender.com/api/v1`).
4. Deploy. Every push to `develop` / `main` triggers a new build.

The storefront, product and store pages are `force-dynamic`, so they always
fetch live data at request time. If the API is unreachable they render a
friendly "service unavailable" screen instead of crashing the build.

## 2. Deploy the backend (example: Render)

1. New **Web Service** → point it at this repo, root directory `backend`.
2. Build command: `npm install && npm run prisma:generate && npm run build`
3. Start command: `npm run start:prod`
4. Environment variables:
   - `DATABASE_URL` — a managed Postgres URL (Render/Neon/Supabase).
     **Switch `backend/prisma/schema.prisma` `provider` from `sqlite` to
     `postgresql`** first, then run `prisma db push` + the seed.
   - `JWT_SECRET` — a long random string.
   - `CORS_ORIGIN` — your Vercel frontend URL (e.g. `https://loopy.vercel.app`).
   - `PORT` — provided by the host automatically.
5. After first deploy, seed once: `npm run db:seed`.

## 3. Wire them together

- Frontend `NEXT_PUBLIC_API_URL` → backend public URL + `/api/v1`.
- Backend `CORS_ORIGIN` → frontend public URL.

---

### Going fully serverless on Vercel (optional, larger change)

If you'd rather host everything on Vercel, the backend needs to be migrated to
Vercel serverless functions backed by **Vercel Postgres / Neon** (no SQLite, no
in-memory OTP state). That's a deliberate refactor — open an issue / ask and it
can be scoped separately.
