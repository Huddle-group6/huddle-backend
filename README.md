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
install JSON Web Token library for authentication:

```bash
npm install jsonwebtoken
```

install bcrypt for password hashing:

```bash
npm install bcrypt
```

install uuid for unique user IDs:

```bash
npm install uuid
```
