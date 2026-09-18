# Gikan

Issue tracking for multiple projects, inspired by Linear. Each project has an issue list, Kanban board, documents, members, labels, cycles, comments, and activity history.

## Stack

- React, Vite, TypeScript, and Tailwind CSS for the frontend.
- Express, TypeScript, Drizzle ORM, and Zod for the backend.
- Tiptap for rich-text descriptions, comments, and documents.
- PostgreSQL for data storage.

## Requirements

- Node.js 22+
- pnpm 10+
- An accessible PostgreSQL instance

## Development

Install dependencies:

```bash
pnpm install
```

Create `apps/api/.env` from `.env.example`. To start a local PostgreSQL instance:

```bash
docker run --name gikan-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=gikan \
  -p 5432:5432 -d postgres:16
```

Apply migrations:

```bash
pnpm db:migrate
```

Start the API and frontend in separate terminals:

```bash
pnpm dev:api   # http://localhost:3000
pnpm dev:web   # http://localhost:5173
```

## Main routes

- `/` — project list.
- `/projects/:projectId` — project overview.
- `/projects/:projectId/issues` — issue list.
- `/projects/:projectId/board` — Kanban board.
- `/projects/:projectId/documents` — project document.
- `/projects/:projectId/issues/:issueIdentifier` — issue page.
- `/projects/:projectId/page` — compatibility redirect to Documents.

Issues use public identifiers such as `LIN-184`. Opening an issue from the list or board displays a Peek panel while preserving the source screen. Direct navigation or a refresh displays the full issue page.

## Useful commands

```bash
pnpm -r typecheck
pnpm build
pnpm db:generate
pnpm db:migrate
```

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign sessions |
| `JWT_EXPIRES_IN` | Session lifetime, for example `7d` |
| `SPECIAL_REGISTRATION_CODE` | Code required to create accounts |
| `ADMIN_USERNAMES` | Comma-separated admin usernames |
| `PORT` | API port, default `3000` |
| `NODE_ENV` | `development` or `production` |

## Deployment

The `Dockerfile` builds the frontend and backend into a single image. On startup, pending migrations are applied before the API starts.

```bash
docker build -t gikan .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://... \
  -e JWT_SECRET=... \
  -e JWT_EXPIRES_IN=7d \
  -e SPECIAL_REGISTRATION_CODE=... \
  -e ADMIN_USERNAMES=... \
  gikan
```

Migrations preserve existing data, convert `cards` into `issues`, and convert legacy Markdown content into Tiptap documents.
