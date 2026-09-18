# Gikan

Multi-project issue tracking platform inspired by Linear. Sign in with registration restricted by a special code, then manage projects with issues, Kanban boards, members, labels, assignees, priorities, cycles, comments, and activity history.

Projects remain the main organizational unit. The Kanban board and the issue list are two views of the same issue collection.

See [PLAN.md](./PLAN.md) for the complete history of project checkpoints and technical decisions.

## Stack

- **Backend**: Express + TypeScript + Drizzle ORM + Zod, in `apps/api`.
- **Frontend**: Vite + React + TypeScript + React Router + Tailwind CSS v4 + Untitled UI (React Aria), in `apps/web`.
- **Rich text**: Tiptap with StarterKit, task lists, links, mentions, and JSON persistence.
- **Shared**: Zod schemas and types used by both sides, in `packages/shared`.
- **Database**: PostgreSQL (external — you provide `DATABASE_URL`).
- **Deployment**: A single Dockerfile; the backend serves the frontend build.

## Prerequisites

- Node.js 22+
- pnpm 10+ (`corepack enable` uses the version defined by `packageManager` in `package.json`)
- An accessible PostgreSQL instance (local via Docker or a managed service)

## Local setup

1. Install the monorepo dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `apps/api/.env` and fill in the values (see the environment variable table below). For development, a local Postgres container is enough:

   ```bash
   docker run --name gikan-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gikan -p 5432:5432 -d postgres:16
   ```

3. Run the migrations:

   ```bash
   pnpm --filter @gikan/api db:migrate
   ```

4. Start the backend and frontend in separate terminals:

   ```bash
   pnpm --filter @gikan/api dev   # http://localhost:3000
   pnpm --filter @gikan/web dev   # http://localhost:5173 (proxy /api -> :3000)
   ```

5. Open `http://localhost:5173` and create an account using the `SPECIAL_REGISTRATION_CODE` configured in `.env`. If your `username` is included in `ADMIN_USERNAMES`, the account is created as an admin.

## Project experience

Each project includes four views:

- `/projects/:projectId` — project overview with status counters, active cycle, estimates, and shortcuts.
- `/projects/:projectId/issues` — dense issue list with search, filters, and sorting.
- `/projects/:projectId/board` — Kanban view using the project's columns as issue statuses.
- `/projects/:projectId/documents` — the project's primary rich-text document.

`/projects/:projectId/page` remains available as a compatibility redirect to Documents.

Issues receive a public identifier such as `LIN-184`, where `LIN` is the project's issue key and `184` is the issue number. Opening an issue from the list or board preserves the source screen and displays the issue in a Peek panel. Direct navigation or a refresh displays the full issue page.

Issues support:

- Inline title and property editing for status, priority, assignee, label, cycle, and estimate.
- Rich-text descriptions and comments stored as Tiptap JSON.
- Sub-issues, same-project relations, comments, and immutable activity history.
- Hard deletion, with protection against deleting an issue that still has sub-issues.

### Other useful commands

```bash
pnpm -r typecheck                         # typecheck all packages
pnpm build                                 # build frontend and backend
pnpm --filter @gikan/api db:generate      # generate a new migration from the schema
pnpm db:migrate                            # apply migrations locally
```

## Environment variables

| Name | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgres://user:pass@host:5432/gikan` |
| `JWT_SECRET` | Secret used to sign the session JWT | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Session token/cookie lifetime | `7d` |
| `SPECIAL_REGISTRATION_CODE` | Code required when registering new users | `a-secret-code` |
| `ADMIN_USERNAMES` | Usernames created as admins (comma-separated) | `coelhomarcus` |
| `PORT` | Port used by Express | `3000` |
| `NODE_ENV` | `development` locally, `production` in deployment (affects the `Secure` cookie flag) | `production` |

## Local production build

```bash
pnpm --filter @gikan/web build   # creates apps/web/dist
pnpm --filter @gikan/api build   # creates apps/api/dist (esbuild bundle)
```

## Docker / Dokploy deployment

The root `Dockerfile` builds the frontend and backend into one image. On container startup it runs `node dist/migrate.js` before starting the API server, so pending Drizzle migrations are applied automatically. `DATABASE_URL` must point to a reachable PostgreSQL instance before the container starts.

```bash
docker build -t gikan .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://... \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e JWT_EXPIRES_IN=7d \
  -e SPECIAL_REGISTRATION_CODE=some-code \
  -e ADMIN_USERNAMES=your-username \
  -e PORT=3000 \
  -e NODE_ENV=production \
  gikan
```

In **Dokploy**, create an application from the repository Dockerfile (without docker-compose — PostgreSQL is external), configure the environment variables above in the dashboard, and point the domain to port `3000` (or the value configured in `PORT`).

The migration also backfills existing projects with deterministic issue keys, converts the former cards table into issues while preserving IDs and timestamps, and converts legacy Markdown descriptions and project pages into Tiptap JSON.

## Structure

```
apps/
├── api/     # Express + Drizzle + Zod, organized by feature (routes → controller → service)
└── web/     # Vite + React + Tailwind + Untitled UI, features/ (logic) + pages/ (routes)
packages/
└── shared/  # Shared Zod schemas, types, and Markdown/Tiptap conversion
```
