# Campus Book Swap

A full-stack university second-hand book exchange platform where students list books, negotiate offers, and coordinate swaps through chat.

## What this project demonstrates

- Full-stack app architecture with a TypeScript API and React frontend
- Authentication and authorization with JWT and role-aware routes
- Password hashing using `bcryptjs`
- PostgreSQL-backed data model for users, books, chats, offers, reports, and moderation flows
- Admin moderation workflows for listing/report handling

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (`pg`)
- Auth/Security: JWT (`jsonwebtoken`), `bcryptjs`, rate limiting

## Key Features

- Book listing and browse/search flows
- In-app chat threads tied to books/offers
- Offer and swap tracking
- Admin panel for moderation and operational controls

## Repository Structure

- `src/` - frontend app (pages, components, contexts)
- `server/` - backend API and DB logic
- `scripts/` - smoke/security/feature test scripts

## Run Locally

```bash
npm install
npm run dev
```

For full setup (including Docker/database env), see `docker-compose.yml` and server environment variables in the project.
