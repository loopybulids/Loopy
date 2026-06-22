# Loopy

Social-commerce thrift marketplace for Instagram sellers (India). Independent
seller storefronts with built-in payments, **escrow-style buyer protection**,
and managed shipping — _"Shopify for Instagram thrift sellers."_



This repo is an **MVP scaffold** built from `Loopy_PRD_v1`. It implements the
core buyer + seller happy path end-to-end, with payments and logistics stubbed
behind clean seams (exactly as the PRD recommends for the 3–4 week MVP).

```
Loopy/
├── frontend/   Next.js (App Router) + TypeScript + Tailwind + Zustand
├── backend/    NestJS + Prisma + SQLite (dev)
├── loopy-designs.html   14 mobile screen mockups
└── loopy-desktop.html   5 desktop / web shots
```

## Tech stack (per PRD §10)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js App Router, TypeScript, Tailwind, Zustand (cart) |
| Backend | NestJS (modular monolith), Prisma ORM, Passport JWT |
| DB (dev) | SQLite — zero infra to run locally |
| DB (prod) | PostgreSQL — flip the provider in `backend/prisma/schema.prisma` |

> **Why SQLite in dev:** so the whole app runs with `npm install` + `npm run dev`
> — no Postgres, Redis, or Docker needed. The schema is Postgres-portable.

---

## Run it (two terminals)

### 1 · Backend → http://localhost:4000
```bash
cd backend
npm install
npm run db:setup     # creates SQLite db + seeds the demo store (run once)
npm run start:dev    # API at http://localhost:4000/api/v1
```

### 2 · Frontend → http://localhost:3000
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

---

## Try the full flow

**As a buyer**
1. Landing → **Browse the demo store** (`/s/riyathrifts`)
2. Open a product → **Add to cart** → **Cart** → **Checkout**
3. **Pay securely** (payment is stubbed) → order confirmation with escrow status

**As the seller**
1. Go to **/seller/login** → continue (phone `9876500210`, OTP `0000`)
2. **/seller/dashboard** shows the order you just placed
3. **Accept order** → **Create shipment** (generates a stub AWB)

---

## What's implemented

- **Auth** — OTP login (dev returns the code; master code `0000`), JWT, route guards
- **Storefront** — public seller store + product pages, served from the API
- **Cart** — client-side (Zustand, persisted to localStorage)
- **Checkout / Orders** — order creation with commission + shipping pricing,
  payment confirmation, transactional inventory decrement (oversell-safe),
  order lifecycle `PendingPayment → Paid → Accepted → Shipped`
- **Seller dashboard** — escrow balance, order queue, accept / ship actions
- **Design system** — indigo / coral / trust palette, Fraunces + Inter, editorial
  storefront matching the mockups

## Stubbed (clear seams, ready to swap in)

These return realistic placeholder data so the flow works without external accounts:

- **Razorpay** payments + payouts → see `backend/src/orders/orders.service.ts`
- **Shiprocket** shipment / AWB → `transition()` in the same file
- **OTP over SMS/WhatsApp** → `backend/src/auth/auth.service.ts` (returns code in dev)

## Not yet built (PRD roadmap / fast-follow)

Returns flow, disputes, admin/ops console, ratings, fraud rules, notifications,
wallet/payout ledger. The modules are structured so these slot in without rework.

---

## Going to production (the important bits from the PRD)

1. **Money flow (PRD §22.1)** — do **not** self-custody buyer funds. Use Razorpay
   Route / licensed escrow for compliant settlement-after-delivery. Treat this as
   a Week-0 blocker before writing real payout code.
2. **Switch DB to Postgres** — change `provider` to `postgresql`, point
   `DATABASE_URL` at your instance, run `prisma migrate`.
3. **Add Redis + BullMQ** for queues (payouts, notifications, webhook retries).
4. **SSR/ISR** the storefront for SEO (currently client-rendered for simplicity).
