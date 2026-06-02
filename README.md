# NxtGenProperties

A modern, 99acres-style **real-estate marketplace for India** — a cross-platform
**Expo / React Native** app backed by a self-hosted **Hono + Drizzle API on Neon
Postgres**, with image storage on **Cloudinary**.

Buyers, owners and brokers can list, search, shortlist, compare, chat in real
time, schedule visits, make offers, and track market trends — all in one place.

## Monorepo structure

```
NxtGenProperties/
├── backend/            # Hono + Drizzle + Neon API — auth, REST, WebSocket chat,
│                       #   Cloudinary uploads, Razorpay, push notifications, alerts
└── nxtgenproperties/   # Expo / React Native mobile app (talks only to the API)
```

> The Next.js **admin panel** and the SvelteKit **web client** each live in their
> own repositories.

## Architecture

```
Expo app ──HTTPS / JWT──▶  Hono API  ──┬─ Neon Postgres (Drizzle ORM)
            + WebSocket (chat)         ├─ Cloudinary (images / documents)
                                       └─ Razorpay · MSG91 · Resend · Google · Expo Push
```

- **Auth** — custom JWT (short-lived access + rotating refresh), phone OTP, Google OAuth.
- **Storage** — Cloudinary; Postgres stores only URLs / public IDs.
- **Realtime chat** — a WebSocket hub on the API.
- **Security** — the API is the trust boundary: every mutation verifies the JWT and ownership.

## Tech stack

**App:** Expo Router · NativeWind · Zustand · Reanimated / Moti
**Backend:** Hono · Drizzle ORM · Neon Postgres · jose (JWT) · Zod
**Services:** Cloudinary · Razorpay · MSG91 (OTP) · Resend (email) · Google OAuth · Expo Push

## Features

Search with 12+ filters · favorites · compare · recently viewed · real-time chat ·
inquiries · make-an-offer / price negotiation · site-visit scheduling ·
projects (new launches) · broker & locality reviews · live ₹/sq.ft price trends ·
contact-reveal gating · saved-search push alerts · membership plans (Razorpay) ·
broker verification (RERA) · seller analytics · map view · financial tools (EMI,
budget) · push & in-app notifications.

## Getting started

**Prerequisites:** Node 18+, a [Neon](https://neon.tech) Postgres database, and a
[Cloudinary](https://cloudinary.com) account. Razorpay / MSG91 / Resend / Google
keys are optional in development (those features no-op or log to the console).

### 1. Backend (`:4000`)

```bash
cd backend
cp .env.example .env.local      # fill in DATABASE_URL, JWT secrets, Cloudinary, etc.
npm install
npm run db:migrate              # apply the schema
npm run seed                    # load demo data
npm run dev                     # http://localhost:4000
```

Configure at least these in `backend/.env.local` (see `.env.example` for the full list):

| Variable                              | Purpose                                  |
| ------------------------------------- | ---------------------------------------- |
| `DATABASE_URL`                        | Neon pooled connection string            |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets               |
| `CLOUDINARY_*`                        | Image & document uploads                 |
| `CORS_ORIGINS`                        | Comma-separated allowed client origins   |

### 2. Mobile app

```bash
cd nxtgenproperties
cp .env.example .env            # set EXPO_PUBLIC_API_URL (e.g. http://<LAN-IP>:4000)
npm install
npm start                       # open in Expo Go or a dev build
```

> On a physical device, point `EXPO_PUBLIC_API_URL` at your machine's LAN IP
> (not `localhost`) and add that origin to the backend's `CORS_ORIGINS`.

### Demo accounts

After seeding (password `Password123!`):

- `owner1@example.com` — property owner
- `broker1@example.com` — broker
- `admin@nxtgenproperties.com` — admin

## Backend scripts

```bash
npm run dev          # start the API with hot reload
npm run db:migrate   # apply migrations
npm run seed         # seed demo data
npm run db:studio    # Drizzle Studio
npm run typecheck    # type-check
npm test             # run tests
```

## License

Proprietary — all rights reserved.
