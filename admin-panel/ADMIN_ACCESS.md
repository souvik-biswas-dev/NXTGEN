# NxtGenProperties — Admin Panel Access Guide

## Overview

The admin panel is a standalone Next.js web application that connects to the same Supabase backend as the mobile app. It uses **JWT sessions** stored in **httpOnly cookies** and requires the user to have `role = 'admin'` in the `users_profiles` table.

---

## Step 1: Run the Migration

Before using the admin panel, run the SQL migration that adds the `admin` role to the database.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → **SQL Editor**
2. Copy and run the contents of:
   ```
   nxtgenproperties/supabase/migrations/005_admin_role.sql
   ```

---

## Step 2: Set Up Environment Variables

In `admin-panel/.env.local`, fill in the required values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lcwgnquyosdlysfcewxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>   # From: Supabase > Settings > API > service_role
ADMIN_JWT_SECRET=<generate-with: openssl rand -base64 32>
```

> **Where to find the Service Role Key:**
> Supabase Dashboard → Project Settings → API → `service_role` (secret) key

> **Generate a strong JWT secret:**
> ```bash
> openssl rand -base64 32
> ```

---

## Step 3: Create Your First Admin User

**Choose ONE of the following options. Once you complete your chosen option, you're done with this step.**

### Option A: Promote an Existing User (Recommended)

If the user already has an account in the mobile app:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run:
   ```sql
   UPDATE public.users_profiles
   SET role = 'admin'
   WHERE email = 'your-admin@example.com';
   ```

✅ **Done!** You can skip Options B and C.

### Option B: Create a New Admin User

1. Go to Supabase Dashboard → **Authentication** → **Users** → **Invite user**
2. Enter the admin email and click **Send invite**
3. The user receives an email → they set a password via the link
4. Then run the SQL in Option A to set their role to `admin`

### Option C: Use the Admin Panel's Create Admin Feature

Once logged in as an existing admin, go to **Users** page and use the action menu to change any user's role to `admin`.

---

## Step 4: Start the Admin Panel

```bash
cd admin-panel
npm install
npm run dev
```

The admin panel runs at: **http://localhost:3000**

---

## Logging In

1. Open **http://localhost:3000**
2. You'll be redirected to **/login**
3. Enter your **admin email** and **password**
4. If credentials are valid AND your role is `admin`, you'll be redirected to the dashboard

> **Security:** If you enter valid credentials but your role is not `admin`, access will be denied with "Access denied. Admin privileges required."

---

## Admin Panel Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Overview stats, charts, recent activity |
| Users | `/users` | Manage all users, roles, broker verification |
| Properties | `/properties` | Verify, feature, delete properties |
| Subscriptions | `/subscriptions` | View and manage subscription plans |
| Inquiries | `/inquiries` | View all property inquiries |
| Reviews | `/reviews` | Manage locality reviews and ratings |
| Analytics | `/analytics` | Charts: users, properties, subscriptions |
| Platform Data | `/platform-data` | Edit app-wide dynamic content (JSON) |

---

## Security Features

- **JWT sessions** in httpOnly cookies (8-hour expiry)
- **Supabase Service Role Key** — server-side only, never exposed to client
- **Middleware protection** — all routes except `/login` require valid admin session
- **Role check** — even with valid Supabase credentials, non-admin users are rejected
- **Server Actions** — all mutations run server-side
- **Zod validation** — all form inputs validated before DB operations

---

## Production Deployment on Hostinger

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload to your Hostinger server via SSH/SFTP

3. Set up environment variables in `.env.local` on the server with your production values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ADMIN_JWT_SECRET=<generate-with: openssl rand -base64 32>
   ```

4. Install dependencies:
   ```bash
   npm install --production
   ```

5. Start the application:
   ```bash
   npm run start
   ```

6. Use **PM2** to keep it running in the background:
   ```bash
   npm install -g pm2
   pm2 start npm --name "admin-panel" -- start
   pm2 save
   pm2 startup
   ```

> **Important:** In production, use a **different, strong** `ADMIN_JWT_SECRET` than in development. Never commit `.env.local` to git.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Access denied. Admin privileges required." | Run the SQL update to set `role = 'admin'` for your user |
| "SUPABASE_SERVICE_ROLE_KEY is not configured" | Add the service role key to `.env.local` |
| Login redirects back to login page | Check if `ADMIN_JWT_SECRET` is set and at least 32 chars |
| "User profile not found" | Ensure the user has signed up and has a row in `users_profiles` |
| Charts not showing | Normal if database has no data yet — populate the app first |

---

## Resetting Admin Access

If locked out, run this in Supabase SQL Editor:

```sql
-- Check existing admin users
SELECT user_id, email, name, role FROM public.users_profiles WHERE role = 'admin';

-- Promote a user to admin
UPDATE public.users_profiles SET role = 'admin' WHERE email = 'your@email.com';

-- Demote an admin (if needed)
UPDATE public.users_profiles SET role = 'buyer' WHERE email = 'other@email.com';
```

---

*NxtGenProperties Admin Panel v1.0 — Built with Next.js 14 + Supabase*
