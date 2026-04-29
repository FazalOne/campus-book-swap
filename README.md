# Campus Book Swap

A full-stack campus marketplace where students can list books for sale or swap, negotiate offers in chat, and track trust and ownership history.  
Includes admin moderation, demo data seeding, and offer audit visibility.

## Core Features

- Authentication with JWT (`register`, `login`, role-aware routes)
- Listings for:
  - `For Sale`
  - `For Swap`
  - both on one listing
- Offer workflow:
  - Buy offers
  - Swap offers
  - pending/accepted/rejected/completed lifecycle
- Real-time-style chat UX with in-thread offer actions
- Reviews + trust score
- Ownership history trail for books transferred across users
- Admin dashboard:
  - user/report/contact moderation
  - offer details and offer audit logs
  - demo reset/seed utilities

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript (`tsx`)
- Database: PostgreSQL
- Auth/Security: `jsonwebtoken`, `bcryptjs`, rate limiting, CORS

## Project Structure

- `App.tsx` - main app UI, routing, major page components
- `server.ts` - API server, schema creation/migrations, business logic
- `api.ts` - frontend API client
- `types.ts` - shared frontend domain types
- `scripts/dev-start.cjs` - launches backend + Vite together

## Local Development (Non-Docker)

### 1) Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 2) Install deps

```bash
npm install
```

### 3) Create database

```sql
CREATE DATABASE campusbookswap;
```

### 4) Create env file

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

### 5) Configure `.env`

At minimum set:

- `DB_PASSWORD`
- `JWT_SECRET`
- optional: `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`

### 6) Start app

```bash
npm run start
```

Open:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)

---

## Demo Setup Guide

### Demo Admin Login

Use either:

- your `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` from `.env`, or
- existing seeded admin credentials already in DB.

### Seed Demo Data

After admin login:

1. Open `Admin Panel`
2. Click `Demo Reset` (optional but recommended)
3. Click `Demo Seed`

This seeds:

- core user set (including realistic listings and offer activity)
- active and completed offers
- chat-linked offer data
- trust/review examples
- ownership history chains for selected books

---

## Docker Quickstart (Automated Demo Stack)

This repo now includes Docker setup to run:

- `app` (frontend + backend)
- `db` (PostgreSQL)

### 1) Run stack

```bash
docker compose up --build
```

### 2) Open app

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)

### 3) Seed demo data

Log in as admin, then use `Admin Panel -> Demo Reset / Demo Seed`.

### Stop stack

```bash
docker compose down
```

To also remove DB volume:

```bash
docker compose down -v
```

---

## Environment Variables

From `.env.example`:

- `PORT` backend port (default `3001`)
- `HOST` backend bind address
- `JWT_SECRET` JWT signing secret
- `JWT_EXPIRES_IN` token expiry (default `12h`)
- `CORS_ORIGIN` allowed frontend origins (comma-separated)
- `BODY_LIMIT` request body limit
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`
- `VITE_API_URL` frontend API base URL

## Scripts

- `npm run dev` - Vite frontend only
- `npm run start` - backend + frontend together (`scripts/dev-start.cjs`)
- `npm run build` - production frontend build
- `npm run preview` - preview built frontend

## Final Verification Checklist (Before Push)

Run:

```bash
npm run build
npx tsc --noEmit
```

Manual smoke checks:

- register/login/logout
- create/edit/list/unlist/delete book
- create buy + swap offers
- accept/reject/cancel/complete offer
- chat thread and in-thread offer actions
- admin offers detail + admin moderation tabs
- demo reset/seed path

## Troubleshooting

- **DB auth error**  
  Check `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and that Postgres is running.

- **Frontend cannot call API**  
  Verify `VITE_API_URL` and CORS (`CORS_ORIGIN`).

- **Port conflict (3000/3001/5432)**  
  Stop conflicting process or change ports in env/compose.

## Security Notes

- Do not commit real secrets in `.env`.
- Change default/seed admin password for non-demo environments.
- Use strict `CORS_ORIGIN` and strong `JWT_SECRET` outside local development.
