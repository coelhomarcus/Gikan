# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# ---------- deps: install everything (including devDependencies) for the build ----------
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

# ---------- build: build the frontend (Vite) and backend (esbuild) ----------
FROM deps AS build
COPY . .
RUN npm run build -w @gikan/web
RUN npm run build -w @gikan/api

# ---------- prod-deps: production dependencies of apps/api only ----------
# The API bundle already inlines @gikan/shared (see apps/api/scripts/build.mjs), so only the
# real third-party dependencies need to exist at runtime.
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev --workspace @gikan/api --include-workspace-root=false

# ---------- runner: minimal final image ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Preserve the apps/api + apps/web sibling structure — server.ts and migrate.ts resolve relative
# paths from cwd (not __dirname), so this structure must match the relative depth used in
# development (see the comments in app.ts/migrate.ts).
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/drizzle ./apps/api/drizzle
COPY --from=build /app/apps/web/dist ./apps/web/dist

WORKDIR /app/apps/api
EXPOSE 3000

CMD ["sh", "-c", "node dist/migrate.js && node dist/server.js"]
