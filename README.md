# admin_panel



## Stack

| Language | TypeScript |
| Framework | Express |
| Database | MongoDB |
| ORM/ODM | Mongoose |
| Auth | JWT |
| Validation | Zod |
| API docs | Swagger |
| Logger | Winston |
| Testing | Jest |
| Docker | Yes |

## Prerequisites

- Node.js 20+
- npm
- A running MongoDB instance (or use `docker compose up` — see Docker below)

## Getting started

```bash
cp .env.example .env   # already generated for you with local defaults — review before deploying
npm install
npm run dev
curl http://localhost:3000/health
```

## Environment variables

Set in `.env` (a working `.env` with local defaults is generated for you; `.env.example` documents the shape without secrets and should be the one committed to git).

| Variable | Purpose |
|---|---|
| `APP_NAME` | Service name, used in logs and Swagger title. |
| `APP_HOST` | Host the server binds to (default 0.0.0.0). |
| `PORT` | Port the server listens on (default 3000). |
| `NODE_ENV` | development, production, or test. |
| `MONGODB_URI` | Connection string for MongoDB. |
| `JWT_SECRET` | Secret used to sign/verify access tokens. MUST be changed in production. |
| `CORS_ORIGIN` | Comma-separated list of allowed origins, e.g. https://app.example.com,https://admin.example.com. |

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload (tsx). |
| `npm run build` | Type-check and compile to dist/. |
| `npm start` | Run the compiled server (dist/server.js). |
| `npm test` | Run the Jest test suite. |
| `npm run lint` | Run ESLint. |

## API endpoints

- `GET /v1/health` — health check, no auth required.
- `GET /docs` — Swagger UI (generated from JSDoc comments in `src/docs/`).
- [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) — full endpoint-by-endpoint reference: what every route does, what it expects, and how the Order/Payment/Shipment/Refund/Inventory modules connect to each other.



## Project structure

```
src/
  app.ts            — Express app: middleware, CORS/helmet/rate-limit, routes, error handling
  server.ts         — process entry point: connects the DB, starts listening, graceful shutdown
  routes/               — Express routers (health, auth, items)
  controllers/          — request handlers
  models/               — ORM-agnostic data access (same function names regardless of ORM chosen)
  middlewares/          — error handling, 404s, request validation, auth guard
  schemas/               — request validation schemas
  docs/                  — JSDoc/@swagger annotations for Swagger UI
  tests/                 — Jest tests
packages/
  config/                — env-driven app config (port, DB, JWT, CORS)
  constants/             — shared string/number constants (HTTP status, pagination, regex, rate limits)
  handlers/              — successHandler/errorHandler response envelope
  utils/                 — logger, payload helpers
  database/              — DB connection manager (Mongoose)
```

## Docker

```bash
docker compose up --build   # runs the API plus a local MongoDB container
```

The API container reads its config from `.env` (via `env_file` in `docker-compose.yml`). The bundled database service is for local development only.

## Testing

```bash
npm test
```

## Security checklist before deploying

- [ ] Replace `JWT_SECRET` with a strong, unique secret (not the `change_me` default).
- [ ] Set `CORS_ORIGIN` to your real frontend origin(s) — do not leave it as `localhost`.
- [ ] Point `NODE_ENV=production` and use a managed/production database, not the Docker Compose one.
- [ ] Put this service behind HTTPS (a reverse proxy or platform load balancer, not in-process).
