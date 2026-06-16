# NxtGenProperties — Admin Panel

A **SvelteKit** (Svelte 5) admin dashboard for NxtGenProperties. It connects
directly to the **same Neon Postgres** the mobile API uses (Drizzle ORM), so it's
fully compatible with the existing backend — same schema, same `users` table for
admin auth.

> Maintained as a **separate repository** from the app/backend. This folder is
> gitignored by the main project.

## Stack
- SvelteKit 2 + Svelte 5 (runes) + `adapter-node`
- Tailwind CSS (teal/navy/gold palette, dark UI)
- Drizzle ORM + Neon Postgres (direct, server-side)
- jose (JWT cookie session) + bcryptjs (admin login against `users`)
- **lucide-svelte** (icons), **Lenis** (smooth scroll), **three.js** (animated login hero)

## Pages
Dashboard · Listings (verify/feature/delete) · Users (role/RERA/delete) ·
Broker Verifications (approve/reject) · Reports (resolve/dismiss) ·
Subscriptions (cancel/extend) · Platform Data (JSON editor) · Analytics.

## Setup
```bash
cp .env.example .env          # DATABASE_URL (same as backend) + ADMIN_JWT_SECRET
npm install
npm run dev                   # http://localhost:3000
```
Log in with an admin account (e.g. the seeded `admin@nxtgenproperties.com`,
password `Password123!`). Admin role is required.

## Build
```bash
npm run build && npm run start   # adapter-node server in ./build
```

## Notes
- The panel is `noindex` and behind a JWT cookie session; every page requires `role = admin`.
- All privileged actions are written to `admin_audit_log`.
- It's a trusted server-side app, so it talks to Neon directly (mirroring the
  API service). It does not need the API running.
