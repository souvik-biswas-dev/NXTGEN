# NxtGenProperties — Web

The web front-end for **NxtGenProperties**, India's next-generation real-estate
marketplace. It is the browser counterpart to the Expo mobile app and talks to
the **same Hono + Drizzle + Neon backend** (`../backend`, port `4000`).

> This folder is git-ignored by the parent (Expo) repository and is intended to
> be pushed as its own standalone repository.

## Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | [SvelteKit](https://svelte.dev) (Svelte 5 runes)  |
| Styling        | [Tailwind CSS v4](https://tailwindcss.com)        |
| Components     | [bits-ui](https://bits-ui.com) (headless)         |
| Icons          | [@lucide/svelte](https://lucide.dev)              |
| Smooth scroll  | [Lenis](https://lenis.darkroom.engineering)       |
| WebGL / 3D     | [Three.js](https://threejs.org) (hero cityscape)  |
| Language       | TypeScript                                         |

The colour palette is ported 1:1 from the mobile app's `constants/theme.ts`
(teal `#0F766E`, navy `#1B2838`, gold `#D4A24C`) — see `src/app.css` `@theme`.

## Getting started

```bash
# 1. Make sure the backend is running first
cd ../backend && npm run db:migrate && npm run seed && npm run dev   # http://localhost:4000

# 2. In this folder
cp .env.example .env       # adjust PUBLIC_API_URL if your API is elsewhere
npm install
npm run dev                # http://localhost:5173
```

Demo logins (password `Password123!`): `owner1@example.com`, `broker1@example.com`.

## Backend integration

All requests go through a thin, typed client in `src/lib/api/`:

- `client.ts` — fetch wrapper with JWT `Authorization` headers, single-flight
  refresh-on-401, and `localStorage` token storage (keys `ngp.accessToken` /
  `ngp.refreshToken`, matching the app).
- `endpoints.ts` — typed groups: `Properties`, `Projects`, `Platform`, `Auth`,
  `Favorites`, `Leads`.
- `types.ts` — response shapes (the API returns **camelCase**, e.g. `areaSqft`,
  `ownerId`).

The backend's `CORS_ORIGINS` should include this app's origin
(`http://localhost:5173` in dev). It already defaults to `*` when unset.

## Pages

| Route                  | Description                                              |
| ---------------------- | ------------------------------------------------------- |
| `/`                    | Landing — WebGL hero, search, featured, cities, launches |
| `/properties`          | Search & filter listings (URL-driven, load-more)        |
| `/properties/[id]`     | Detail — gallery, specs, map, inquiry & site-visit       |
| `/projects`            | New launches grid (filter by city)                      |
| `/projects/[id]`       | Project detail — floor plans, amenities                 |
| `/insights`            | Market trends, membership plans, FAQs                   |
| `/tools/emi`           | Interactive EMI calculator + lender comparison          |
| `/favorites`           | Saved properties (syncs when signed in)                 |
| `/dashboard`           | Account & my listings (auth)                            |
| `/login`, `/register`  | Authentication                                          |

## Scripts

```bash
npm run dev       # dev server
npm run build     # production build
npm run preview   # preview the build
npm run check     # svelte-check (type checking)
```

## Deployment

Uses `@sveltejs/adapter-auto`. Swap it for a platform adapter
(`adapter-node`, `adapter-vercel`, `adapter-static`, …) in `svelte.config.js`
before deploying, and set `PUBLIC_API_URL` to your hosted backend URL.
