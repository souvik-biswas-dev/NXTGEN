# NxtGenProperties

A 99acres-style real estate marketplace for India — **Expo / React Native** app
backed by a self-hosted **Hono + Drizzle API on Neon Postgres**, with image
storage on **Cloudinary**.

> Migrated off Supabase to a real backend (June 2026). See [`SETUP.md`](./SETUP.md)
> for full setup, and [`APIKEYSETUP.md`](./APIKEYSETUP.md) for credentials.

## Structure

```
NxtGenProperties/
├── backend/            # Hono + Drizzle + Neon API: auth, REST, WebSocket chat,
│                       #   Cloudinary uploads, Razorpay, push, alerts
└── nxtgenproperties/   # Expo / React Native mobile app (talks only to the API)
```

> The Next.js **admin panel** lives in its own repository.

## Architecture

```
Expo app ──HTTPS/JWT──▶  Hono API  ──┬─ Neon Postgres (Drizzle ORM)
            + WebSocket (chat)        ├─ Cloudinary (images / documents)
                                      └─ Razorpay · MSG91 · Resend · Google · Expo Push
```

- **Auth** — custom JWT (access + rotating refresh), phone OTP, Google OAuth.
- **Storage** — Cloudinary; Postgres stores only URLs / public_ids.
- **Realtime chat** — WebSocket hub (replaces Supabase Realtime).
- **Security** — the API is the boundary: every mutation checks the JWT and ownership.

## Quick start

```bash
# 1) Backend
cd backend && cp .env.example .env.local   # fill in values (see APIKEYSETUP.md)
npm install && npm run db:migrate && npm run seed && npm run dev   # :4000

# 2) App
cd ../nxtgenproperties && cp .env.example .env   # set EXPO_PUBLIC_API_URL
npm install && npm start
```

Demo logins (after seeding, password `Password123!`):
`owner1@example.com` · `broker1@example.com` · `admin@nxtgenproperties.com`.

## Features

Search with 12+ filters · favorites · compare · recently viewed · real-time chat ·
inquiries · **make-an-offer / negotiation** · site visits · projects (new launches) ·
broker reviews & locality reviews · **live ₹/sqft locality price trends** ·
**contact-reveal gate** · **saved-search push alerts** · membership (Razorpay) ·
broker verification (RERA) · seller analytics · map view · financial tools ·
push & in-app notifications.

## Tech

Expo Router · NativeWind · Zustand · Reanimated/Moti · Hono · Drizzle ORM ·
Neon Postgres · Cloudinary · jose (JWT) · Razorpay.

## Docs
- [`SETUP.md`](./SETUP.md) — full manual setup & deploy
- [`APIKEYSETUP.md`](./APIKEYSETUP.md) — every credential (untracked)
- [`APP.md`](./APP.md) — build & release (untracked)
