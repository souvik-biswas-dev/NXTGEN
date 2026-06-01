# NxtGenProperties — Manual Setup

This project replaced Supabase with a **self-hosted backend on Neon Postgres**.
Three pieces:

| Folder | What it is | Talks to |
|--------|------------|----------|
| `backend/` | Hono + Drizzle API server (auth, REST, WebSocket chat, Cloudinary uploads, Razorpay) | Neon, Cloudinary, Razorpay, MSG91, Resend, Google, Expo Push |
| `nxtgenproperties/` | Expo / React Native app | the backend only |
| `admin-panel/` | Next.js admin dashboard | Neon directly (trusted server) |

> **Why a backend?** Neon is *only* Postgres. Supabase had also been doing auth,
> storage, realtime, and edge functions. The `backend/` service now owns all of that.

---

## 0. Prerequisites
- Node 20+ and npm
- A [Neon](https://neon.tech) account (free tier is fine)
- A [Cloudinary](https://cloudinary.com) account (image/document storage; free tier is fine)
- Razorpay test keys, and optionally MSG91 / Resend / Google OAuth / Expo
- Expo Go or a dev build on your phone/simulator

---

## 1. Neon Postgres
1. Create a Neon project → copy the **pooled** connection string (host ends in `-pooler`).
2. You'll paste it into `backend/.env.local` and `admin-panel/.env.local` as `DATABASE_URL`.

## 2. Cloudinary (property images, avatars, broker docs)
1. Create a Cloudinary account → **Dashboard** shows your account details.
2. Copy: **Cloud name** → `CLOUDINARY_CLOUD_NAME`, **API Key** → `CLOUDINARY_API_KEY`, **API Secret** → `CLOUDINARY_API_SECRET`.
3. Nothing else to configure — the backend signs uploads and the app posts files straight to Cloudinary. Broker documents are uploaded as `authenticated` (private) and served via short-lived signed URLs.
> **Image storage rule:** files live in Cloudinary; Postgres stores only the `secure_url` (public) or `public_id` (private). Never store image bytes in the DB.

## 3. Razorpay (subscriptions)
- Dashboard → **Settings → API Keys** (Test mode): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

## 4. Phone OTP — MSG91 (optional; logs OTP to console if unset)
- MSG91 → Auth Key + an OTP template ID → `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`, `MSG91_SENDER_ID`.

## 5. Email — Resend (optional; logs to console if unset)
- Resend → API key → `RESEND_API_KEY`; set a verified `EMAIL_FROM`.

## 6. Google OAuth (optional)
- Google Cloud Console → OAuth client (Web). Copy the **Web client ID** for the app
  (`EXPO_PUBLIC_GOOGLE_CLIENT_ID`) and the client id/secret for the backend
  (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`).

## 7. Expo Push (optional)
- A dev build with `eas` configured. `EXPO_ACCESS_TOKEN` only needed for high volume.

---

## 8. Backend — run it
```bash
cd backend
cp .env.example .env.local        # then fill in real values in .env.local
# generate two strong JWT secrets:
openssl rand -base64 48           # -> JWT_ACCESS_SECRET
openssl rand -base64 48           # -> JWT_REFRESH_SECRET

npm install
npm run db:migrate                # create all tables in Neon
npm run seed                      # demo users + properties + projects + platform_data
npm run dev                       # http://localhost:4000  (GET /health to verify)
```
> The server loads env from `.env` **and** `.env.local` (dotenv). Keep real secrets
> in `.env.local` (gitignored). `.env.example` is a committed placeholder template.

**Seeded demo logins** (password `Password123!`):
- `owner1@example.com` (owner) · `broker1@example.com` (broker) · `admin@nxtgenproperties.com` (admin)

## 9. Mobile app — run it
```bash
cd nxtgenproperties
cp .env.example .env
#   EXPO_PUBLIC_API_URL  -> http://localhost:4000 on simulator/web,
#                           or http://<your-LAN-IP>:4000 on a physical device
#   EXPO_PUBLIC_GOOGLE_CLIENT_ID -> Web client id (optional)
npm install
npm start
```
Also set `extra.apiUrl` / `extra.googleClientId` in `app.json` if you build with EAS.

## 10. Admin panel — run it
```bash
cd admin-panel
cp .env.local.example .env.local
#   DATABASE_URL       -> same Neon string as the backend
#   ADMIN_JWT_SECRET   -> openssl rand -base64 48
npm install
npm run dev                        # http://localhost:3000  (log in as the admin above)
```

---

## 11. Run order (fresh machine)
1. Neon project + Cloudinary account created, keys gathered.
2. `backend`: fill `.env.local` → `db:migrate` → `seed` → `dev`.
3. `nxtgenproperties`: fill `.env` → `npm start`.
4. `admin-panel`: fill `.env.local` → `npm run dev`.

## 12. Deploy notes
- **Backend** → Railway / Render / Fly (any long-running Node host; WebSocket support needed for chat). Set all env vars there; use the Neon pooled URL.
- **Admin** → Vercel/Node host with `DATABASE_URL` + `ADMIN_JWT_SECRET`.
- **App** → EAS build; point `EXPO_PUBLIC_API_URL` at the deployed backend (https).

## 13. Security
- `.env.local` files are gitignored — **never commit real keys**. `.env.example` holds placeholders only.
- The API is the security boundary (Supabase RLS is gone): every mutating route checks the JWT and ownership server-side.
