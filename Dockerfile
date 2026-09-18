# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# ---------- deps: install everything (including devDependencies) for the build ----------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# ---------- build: build the frontend (Vite) and backend (esbuild) ----------
FROM deps AS build
COPY . .
RUN pnpm --filter @gikan/web build
RUN pnpm --filter @gikan/api build
# `pnpm deploy` produces a self-contained directory (node_modules with only production deps +
# prebuilt dist/ + drizzle/) for apps/api, avoiding workspace symlink problems that would occur
# when manually copying node_modules between stages.
RUN pnpm --filter @gikan/api deploy --prod --legacy /app/deploy-api

# ---------- runner: minimal final image ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Preserve the apps/api + apps/web sibling structure — server.ts and migrate.ts resolve relative
# paths from cwd (not __dirname), so this structure must match the relative depth used in
# development (see the comments in app.ts/migrate.ts).
COPY --from=build /app/deploy-api ./apps/api
COPY --from=build /app/apps/web/dist ./apps/web/dist

WORKDIR /app/apps/api
EXPOSE 3000

CMD ["sh", "-c", "node dist/migrate.js && node dist/server.js"]
