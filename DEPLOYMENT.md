# TekCroft KPI CRM — Production Deployment Guide

## Prerequisites

- **Node.js** 18.17+ (LTS recommended)
- **PostgreSQL** 14+ database (local or managed, e.g. Supabase, Neon, Railway)
- A hosting provider that supports Node.js (Vercel, Railway, Render, VPS/cPanel with Node)

---

## 1. Environment Setup

Copy the template and fill in your real values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string with `?sslmode=require` for remote DBs |
| `NEXTAUTH_URL` | Yes | Canonical URL of your deployed app (e.g. `https://kpi.tekcroft.com`) |
| `NEXTAUTH_SECRET` | Yes | Strong random string — run `openssl rand -base64 32` |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` | Yes | Email domain restriction (e.g. `@tekcroft.com`) |
| `APP_NAME` | No | Display name shown in the UI |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated origins if an external frontend calls the API |
| `PORT` | No | Server port (defaults to 3000) |

---

## 2. Install & Build

```bash
npm install
npx prisma migrate deploy   # apply migrations to production DB
npm run build                # creates optimized .next/ output
```

---

## 3. Start the Server

```bash
npm start                    # starts Next.js on PORT (default 3000)
```

### Using the standalone output (Docker / VPS)

The build produces a `standalone` folder inside `.next/`:

```bash
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
node .next/standalone/server.js
```

---

## 4. Database Seeding (first deploy only)

```bash
npm run seed
```

This creates the default admin account. Change the password immediately after first login.

---

## 5. Platform-specific notes

### Vercel
- Push to a Git repository and import it in Vercel.
- Set all environment variables in the Vercel dashboard.
- Vercel runs `npm run build` automatically.
- Add a build command override if needed: `prisma generate && prisma migrate deploy && next build`

### Railway / Render
- Connect your repo and set environment variables in the dashboard.
- Use the start command: `npm start`
- Ensure the PostgreSQL add-on is provisioned and `DATABASE_URL` is set.

### cPanel / VPS
- Upload the project files (or clone from Git).
- Run `npm install --production=false && npm run build`.
- Use PM2 or systemd to keep the server running: `pm2 start npm --name "kpi-crm" -- start`

---

## 6. Security Checklist

- [ ] `NEXTAUTH_SECRET` is a strong random value (not the dev placeholder)
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] `.env` / `.env.local` are NOT committed to version control
- [ ] HTTPS is enforced (via hosting provider or reverse proxy)
- [ ] Default admin password has been changed after first login
