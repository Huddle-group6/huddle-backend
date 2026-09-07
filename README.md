# Huddle — Backend

Backend for Huddle's Sprint 1 slice: **authentication + channel messaging**.

## Stack
- Node.js + Express
- PostgreSQL (not wired up yet — connection lands with the auth work)

## Branches
- `main` — stable
- `dev` — active development, PR into here first

## Getting started
```bash
npm install
cp .env.example .env
npm run dev
```

`GET /api/health` → `{ "status": "ok" }`
