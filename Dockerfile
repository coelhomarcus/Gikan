# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# ---------- deps: instala tudo (incl. devDependencies) pra poder buildar ----------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# ---------- build: builda o frontend (Vite) e o backend (esbuild) ----------
FROM deps AS build
COPY . .
RUN pnpm --filter @todokanban/web build
RUN pnpm --filter @todokanban/api build
# `pnpm deploy` produz uma pasta autocontida (node_modules só com deps de produção +
# dist/ + drizzle/ já buildados) pra apps/api, sem os problemas de symlink de workspace
# que apareceriam tentando copiar node_modules manualmente entre stages.
RUN pnpm --filter @todokanban/api deploy --prod --legacy /app/deploy-api

# ---------- runner: imagem final mínima ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Preserva a estrutura apps/api + apps/web (irmãos) — server.ts e migrate.ts resolvem
# caminhos relativos a partir do cwd (não de __dirname), então essa estrutura precisa
# bater com a mesma profundidade relativa usada em dev (ver comentários em app.ts/migrate.ts).
COPY --from=build /app/deploy-api ./apps/api
COPY --from=build /app/apps/web/dist ./apps/web/dist

WORKDIR /app/apps/api
EXPOSE 3000

CMD ["sh", "-c", "node dist/migrate.js && node dist/server.js"]
