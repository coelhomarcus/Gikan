# Plano — TodoKanban

> Legenda: `[ ]` não iniciado · `[~]` em progresso · `[x]` concluído. Marcar conforme o trabalho avança.

## Contexto

Plataforma de Todo/Kanban multi-projeto. Login com registro restrito por um "código especial" vindo de ENV; um usuário cujo `username` está listado em outra ENV var vira admin automaticamente ao se registrar (ex: `coelhomarcus`). A plataforma organiza o trabalho em **Projetos**; dentro de cada projeto existe um quadro **Kanban** clássico (colunas + cards), com cards contendo título, descrição, responsável, criador, data de criação, dificuldade e categoria (categorias criadas pelos usuários, por projeto). Monorepo único: backend Express que também serve o build do frontend Vite, banco Postgres externo (URL fornecida pelo usuário), deploy via Dockerfile único hospedado no **Dokploy**.

## Decisões confirmadas

1. **UI**: ~~sem Untitled UI React pago~~ — **correção**: descobrimos durante a implementação que os componentes base da Untitled UI React são **open-source (MIT)**, distribuídos via CLI copy-paste (`npx untitledui@latest`), construídos sobre **React Aria Components** + Tailwind v4. Só a camada "Pro" (ícones extra, dashboards prontos) é paga. Decisão revisada: usar os componentes reais deles (`apps/web/src/components/base/`, `components/application/`, `components/foundations/`) em vez de construir tudo do zero. Ver `apps/web/CLAUDE.md` (gerado pela própria CLI) para convenções de uso (nomenclatura `Aria*`, kebab-case, tokens semânticos de cor, etc.).
2. **"Avançar níveis" do card** = mover entre colunas do Kanban. Não existe campo de estágio separado; a coluna é o único conceito de progresso. Movimentação por drag-and-drop **e** por um seletor explícito dentro do modal do card (mesmo endpoint da API).
3. **Categorias são por projeto**, não globais.
4. **Deploy**: Dockerfile único multi-stage, hospedado no **Dokploy**. Dokploy builda a partir do Dockerfile do repo e roteia uma porta interna configurável do container via dashboard (`PORT`, default `3000`); env vars setadas direto no dashboard. Sem docker-compose — Postgres é externo.
5. **Admin (`ADMIN_USERNAMES`) tem bypass total**: vê e gerencia qualquer projeto do sistema, mesmo sem ser membro.
6. **Estilo visual: inspirado no design system Geist da Vercel, dark-first.**

## Design visual (Vercel / Geist, dark-first) — implementado no Checkpoint 0

A Untitled UI React já vem com um sistema de dark mode embutido (classe `.dark-mode` na raiz, tokens semânticos `bg-primary`/`text-primary`/`border-primary`/etc. que trocam de valor automaticamente). Em vez de reinventar tokens hex manualmente, ajustamos o sistema deles:

- **Tema padrão = dark** (`apps/web/src/providers/theme-provider.tsx`, `defaultTheme = "dark"`). Em dark mode, `bg-primary` = `neutral-950` do Tailwind (~preto), `text-primary` = `neutral-50` (~branco) — visual bem próximo do dashboard da Vercel.
- **Cor de marca (`--color-brand-*`) sobrescrita em `apps/web/src/styles/theme.css`** para uma escala de azul estilo Vercel, com `--color-brand-600 = rgb(0 112 243)` (`#0070f3`, o azul exato da Vercel) como o step "cor interativa primária" (convenção da própria Untitled UI).
- **Tipografia**: fontes **Geist Variable** e **Geist Mono Variable**, self-hosted via `@fontsource-variable/geist` + `@fontsource-variable/geist-mono` (sem CDN externo), substituindo o Inter/Google Fonts padrão do scaffold em `--font-body`/`--font-display`/`--font-mono`.
- **Sombras/bordas**: já seguem a filosofia "shadow-as-border" da própria Untitled UI (`border-secondary`, `border-primary`) — nada a mudar aqui.
- Componentes devem sempre usar as classes semânticas (`text-primary`, `bg-secondary`, `border-primary`) e nunca cores Tailwind cruas (`text-gray-900`, `bg-blue-700`) — regra documentada em `apps/web/CLAUDE.md`.

## Stack e decisões técnicas complementares

- **Gerenciador de pacotes**: `pnpm` workspaces (v10.9.0 / Node 22.14.0).
- **`packages/shared`** sem build próprio (`main`/`types` apontam pro `src/index.ts`).
- **Backend build**: `tsc` puro (sem bundlar `pg`).
- **`bcryptjs`** (puro JS, sem binding nativo).
- **Drag-and-drop**: `@dnd-kit/core` + `@dnd-kit/sortable`.
- **Estado de servidor no frontend**: `@tanstack/react-query`.
- **Formulários**: `react-hook-form` + `@hookform/resolvers/zod`.
- **Auth**: JWT (HS256) em cookie `httpOnly`, `bcryptjs` para senha.
- **UUID**: `gen_random_uuid()` nativo do Postgres.
- **Migrations** rodam automaticamente no boot do container.
- **`apps/api` é CommonJS, não ESM** (`"type": "module"` removido do `package.json`, `tsconfig.json` usa `module: "CommonJS"` / `moduleResolution: "Node10"`). Motivo: o `drizzle-kit generate` carrega `drizzle.config.ts` e o schema via `require()` (CJS) internamente; com `moduleResolution: "NodeNext"` (ESM) somos obrigados a escrever extensão `.js` nos imports relativos (ex: `from "./users.js"`), mas o loader CJS do drizzle-kit procura um arquivo `.js` literal e falha (`Cannot find module`). CommonJS com imports sem extensão resolve nos dois lados (nosso `tsc`/`node` e o `drizzle-kit`).

## Estrutura de diretórios

```
TodoKanban/
├── PLAN.md
├── README.md
├── .gitignore / .dockerignore
├── Dockerfile
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── server.ts / app.ts
│   │   │   ├── config/env.ts
│   │   │   ├── db/{index.ts, schema/{users,projects,project-members,categories,board-columns,cards}.ts}
│   │   │   ├── middleware/{auth,admin,project-membership,error-handler}.middleware.ts
│   │   │   ├── lib/{jwt.ts, password.ts}
│   │   │   ├── features/{auth,projects,categories,columns,cards,users}/
│   │   │   └── types/express.d.ts
│   │   ├── drizzle/
│   │   └── drizzle.config.ts
│   └── web/                        # gerado via `npx untitledui@latest init --vite`
│       ├── src/
│       │   ├── lib/{api-client.ts, query-client.ts}       # a criar
│       │   ├── components/base/            # Button, Input, Select, Modal, Badge, Avatar... (Untitled UI, prontos)
│       │   ├── components/application/     # padrões complexos (tabs, table, pagination...) (Untitled UI, prontos)
│       │   ├── components/foundations/     # ícones decorativos, logo (Untitled UI, prontos)
│       │   ├── components/layout/          # AppShell/Sidebar/Topbar — a criar em cima da base
│       │   ├── providers/{theme-provider.tsx, router-provider.tsx}  # prontos
│       │   ├── features/{auth,projects,categories,board}/  # a criar
│       │   └── pages/{home-screen,not-found,...}.tsx       # Login/Register/Projects/Board — a criar
│       ├── CLAUDE.md               # convenções da Untitled UI (nomenclatura, tokens de cor, padrões de componente)
│       └── vite.config.ts
└── packages/shared/
    └── src/schemas/{auth,users,projects,categories,columns,cards}.ts
```

## Schema de banco de dados

Enums: `project_role` (`owner`|`member`), `card_difficulty` (`low`|`medium`|`high`, default `medium`).

- **users**: id, name, username (unique), email (unique), password_hash, is_admin (default false), created_at, updated_at.
- **projects**: id, name, description?, created_by → users, created_at, updated_at.
- **project_members**: id, project_id → projects (cascade), user_id → users (cascade), role (default `member`), joined_at; unique(project_id, user_id).
- **categories**: id, project_id → projects (cascade), name, color?, created_by → users, created_at; unique(project_id, name).
- **board_columns**: id, project_id → projects (cascade), name, position (real), created_at.
- **cards**: id, project_id → projects (cascade), column_id → board_columns (cascade), title, description?, assignee_id? → users (set null), category_id? → categories (set null), difficulty (default `medium`), created_by → users, position (real), created_at, updated_at.

**Position**: espaçamento de 1000 entre itens novos; mover = ponto médio entre vizinhos; reindexar em lote se o gap ficar muito pequeno.

**Autorização geral**: `requireProjectMember`/`requireProjectOwner` sempre fazem bypass se `req.user.isAdmin`.

## Variáveis de ambiente

| Nome | Propósito | Exemplo |
|---|---|---|
| `DATABASE_URL` | Postgres externo | `postgres://user:pass@host:5432/todokanban` |
| `JWT_SECRET` | Assinatura do JWT | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Validade do token/cookie | `7d` |
| `SPECIAL_REGISTRATION_CODE` | Código exigido no registro | `tk-invite-2026` |
| `ADMIN_USERNAMES` | Usernames que nascem admin, separados por vírgula | `coelhomarcus` |
| `PORT` | Porta interna do Express | `3000` |
| `NODE_ENV` | afeta `cookie.secure` e verbosidade de erro | `production` |

## Checkpoints

### [x] Checkpoint 0 — Setup do monorepo
`git init`, `.gitignore`, `pnpm-workspace.yaml`, `package.json` raiz, `tsconfig.base.json`, `packages/shared` (placeholder), `apps/api` (Express "Hello World" em `/api/health`), `apps/web` gerado via `npx untitledui@latest init web --vite -y` (React Aria + Tailwind v4 + `@untitledui/icons`), depois adaptado: nome do pacote `@todokanban/web`, dependência workspace de `@todokanban/shared`, proxy `/api` no `vite.config.ts`, tema dark por padrão, paleta de marca trocada para azul Vercel (`#0070f3`), fontes Geist Variable/Geist Mono Variable via `@fontsource-variable`, `date-picker/` removido (não usado, tinha bug de tipos upstream). `.env.example` na raiz.
**Verificado**: `pnpm install` limpo (com `pnpm.onlyBuiltDependencies: ["esbuild"]` no root `package.json` pra permitir o build script do esbuild sem prompt interativo); `pnpm -r typecheck` passa nos 3 pacotes; API responde `{"status":"ok"}` em `/api/health`; Vite sobe em `:5173` com tema dark, fontes Geist e componentes Untitled UI renderizando sem erro de console (confirmado via screenshot Playwright).

### [x] Checkpoint 1 — Schema do banco + migrations
6 tabelas (`users`, `projects`, `project_members`, `categories`, `board_columns`, `cards`) + 2 enums (`project_role`, `card_difficulty`) em `apps/api/src/db/schema/*.ts`, `relations()` completas em `schema/index.ts`, `drizzle.config.ts`, `db/index.ts` (pool `pg` + `drizzle`), `db/migrate.ts` (roda migrations via `drizzle-orm/node-postgres/migrator`). Nesse checkpoint `apps/api` foi convertido de ESM para CommonJS (ver decisão acima).
**Verificado**: Postgres 16 local via Docker (`docker run ... postgres:16`, container `tk-db`); `pnpm db:generate` gerou `drizzle/0000_soft_mastermind.sql` com as 6 tabelas + 2 enums + FKs/índices corretos; `pnpm db:migrate` aplicou com sucesso; `\dt`/`\dT+` no psql confirmam as 6 tabelas e os 2 enums no banco. `pnpm -r typecheck` limpo e API sobe normalmente após a conversão para CJS.

### [x] Checkpoint 2 — Auth completo
`registerSchema`/`loginSchema` em `packages/shared/src/schemas/auth.ts`, `apps/api/src/features/auth/{auth.routes,auth.controller,auth.service}.ts`, `lib/jwt.ts` (HS256, payload `{sub,username,isAdmin}`), `lib/password.ts` (bcryptjs), `lib/cookies.ts` (cookie `tk_session` httpOnly/sameSite=lax, `maxAge` via `ms(JWT_EXPIRES_IN)`), `lib/http-error.ts`, `middleware/{auth,admin,async-handler,error-handler}.middleware.ts`, `config/env.ts` (valida ENV com Zod no boot, falha rápido se faltar var obrigatória), `types/express.d.ts` (augmenta `Request.user`). Endpoints: `POST /api/auth/{register,login,logout}`, `GET /api/auth/me`.
**Verificado via curl**: registro de `coelhomarcus` → `is_admin=true` na resposta e no banco; código especial errado → 403; username duplicado → 409; registro de usuário comum → `is_admin=false`; login por username e por email; senha errada → 401; `/me` autenticado retorna o usuário (sem `password_hash`); logout limpa o cookie; `/me` sem sessão/depois do logout → 401; payload inválido → 400 com `fields` detalhados (erro Zod formatado pelo `error-handler.middleware.ts`).
**Nota para o Checkpoint 11**: `packages/shared` ainda não tem build próprio (`main` aponta pro `.ts` fonte) — funciona em dev porque `tsx` transpila on-the-fly, mas um `tsc && node dist/server.js` em produção não vai conseguir importar um `.ts` cru. Resolver no Dockerfile: ou (a) dar um build `tsc` pro `shared` e apontar `main`/`types` pro `dist`, ou (b) bundlar `apps/api` com esbuild (mantendo `pg` como external) pra resolver TS cross-package sem build step separado.

### [x] Checkpoint 3 — Projetos CRUD + membros
`packages/shared/src/schemas/projects.ts` (`createProjectSchema`, `updateProjectSchema`, `addProjectMemberSchema`), `apps/api/src/features/projects/{projects.routes,projects.controller,projects.service}.ts`, `middleware/project-membership.middleware.ts` (`requireProjectMember`/`requireProjectOwner`, bypass se `isAdmin`, 404 se o projeto não existe). `POST /api/projects` cria projeto + membro `owner` + 3 colunas default (`A Fazer`/`Em Progresso`/`Concluído`, positions 1000/2000/3000) numa `db.transaction`. Rotas: `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:projectId`, `GET/POST /api/projects/:projectId/members`, `DELETE /api/projects/:projectId/members/:userId`.
**Correção de tipos**: Express 5 tipa `req.params` como `Record<string, string | string[]>` (path-to-regexp v6/v8 permite segmentos repetidos). Tornei `middleware/async-handler.ts` genérico sobre o shape dos params (`asyncHandler<{projectId: string}>(...)`) em vez de espalhar `as string` pelos controllers — resolve na raiz e já serve pros próximos checkpoints (cards, columns, categories).
**Verificado via curl**: `ana` (não-admin) cria projeto → owner + 3 colunas seedadas confirmadas no banco; `bob` não-membro não vê o projeto na lista nem consegue acessar direto (403); `coelhomarcus` (admin) acessa via bypass; `ana` convida `bob` → aparece pra ele; convite duplicado → 409; username inexistente → 404; não-owner tentando convidar/editar/deletar → 403; tentar remover o próprio owner → 400; remover membro comum → 204 e ele some da lista; `DELETE /api/projects/:id` deleta com cascade confirmado (colunas e membros somem junto).

### [x] Checkpoint 4 — Categorias por projeto
`packages/shared/src/schemas/categories.ts` (`createCategorySchema`, cor hex opcional validada por regex), `apps/api/src/features/categories/{categories.routes,categories.controller,categories.service}.ts`, montado como sub-rota via `projectsRouter.use("/:projectId/categories", categoriesRouter)` (`Router({ mergeParams: true })` pra herdar `:projectId` do router pai). Qualquer membro do projeto lista/cria; exclusão restrita a quem criou a categoria, ao owner do projeto, ou admin.
**Verificado via curl**: `ana` (owner) e `bob` (membro) criam categorias; nome duplicado no mesmo projeto → 409; cor inválida → 400; `bob` tentando deletar categoria criada por `ana` → 403; `bob` deletando a própria categoria → 204; `ana` (owner) deletando categoria de qualquer um → 204; categoria já deletada → 404; usuária não-membro (`carol`) → 403 tanto pra listar quanto pra criar; admin com bypass consegue listar mesmo sem ser membro.

### [x] Checkpoint 5 — Kanban: colunas + cards
`packages/shared/src/schemas/{columns,cards}.ts` (ambos com `.strict()` — sobra de graça o bloqueio de campos imutáveis do Checkpoint 6, já que `createdBy`/`createdAt`/`projectId` nem existem no schema de update). `apps/api/src/features/columns/*` montado como sub-rota `/api/projects/:projectId/columns`. `apps/api/src/features/cards/*` com **dois routers**: `projectCardsRouter` (`/api/projects/:projectId/cards`, list+create, exige membership via `:projectId` da URL) e `cardsRouter` (`/api/cards/:cardId`, PATCH+DELETE — aqui não há `:projectId` na URL, então o projeto é descoberto a partir do próprio card e a membership é checada via um novo helper `assertProjectMembership()` extraído do `project-membership.middleware.ts`). Position calculada automaticamente (`max+1000`) ao criar ou mover sem `position` explícita; cliente pode enviar `position` exata (estilo midpoint) pra reordenar com precisão. Exclusão de coluna bloqueada (409) se tiver cards.
**Nota**: `assigneeId` já existe no `updateCardSchema` mas a validação "deve ser membro do projeto" fica pro Checkpoint 6, junto com o `GET /api/cards/:id` hidratado.
**Verificado via curl**: colunas default seedadas; nova coluna com position 4000; cards com position incrementando (1000→2000) na mesma coluna; mover card só com `columnId` reposiciona automaticamente pro fim da coluna destino; mover com `position` explícita (ex: `500.5`) funciona; `columnId`/coluna de outro projeto → 400 (validação cruzada); não-membro → 403 tanto na rota aninhada (`/projects/:id/cards`) quanto na solta (`/cards/:id`); deletar coluna com card dentro → 409, depois de esvaziar → 204; `difficulty` fora do enum → 400; `PATCH` com `createdBy` (campo imutável) → 400 automático via `.strict()`; coluna inexistente → 404.

### [x] Checkpoint 6 — Detalhe do card completo
`GET /api/cards/:cardId` (`cards.service.getCardDetail`) usa a query relacional do Drizzle (`with: { assignee, createdBy, category, column }`) — a relação `createdBy` tem o mesmo nome da coluna escalar `created_by`, e o Drizzle resolve isso substituindo o valor da coluna pelo objeto hidratado no resultado (exatamente o shape que a API precisa, sem mapeamento manual). `updateCard` ganhou `ensureAssigneeIsMember`: se `assigneeId` for enviado (não-null), valida que o usuário é membro do projeto do card (400 se não for); `assigneeId: null` desatribui livremente.
**Verificado via curl**: `GET` retorna `assignee`/`category` como `null` quando não setados e como objeto hidratado quando setados; `column` e `createdBy` sempre hidratados; atribuir usuário não-membro → 400; convidar o usuário e atribuir de novo → funciona e aparece hidratado no `GET` seguinte; atribuir categoria → hidratada no `GET`; desatribuir (`assigneeId: null`) funciona; não-membro tentando `GET` → 403; card inexistente → 404.

### [ ] Checkpoint 7 — Frontend: layout do app + rotas (base visual já pronta desde o Checkpoint 0)
Os componentes base (Button, Input, Modal, Select, Badge, Avatar, Dropdown...) já existem via Untitled UI — não precisam ser construídos do zero. Este checkpoint foca em: `components/layout/{AppShell,Sidebar,Topbar,AuthLayout}.tsx` montados sobre os componentes base, `routes.tsx` com as rotas reais do app, `lib/api-client.ts` (fetch wrapper, `credentials: include`), `lib/query-client.ts` (React Query). Adicionar componentes extra da Untitled UI sob demanda via `npx untitledui@latest add <component>` conforme a necessidade de cada tela.
**Pronto quando**: navegação entre AppShell/Sidebar/rotas reais funcionando, sem erro de console.

### [ ] Checkpoint 8 — Frontend: telas de auth
Login/Register, `useAuth`, `RequireAuth`.
**Pronto quando** (browser): fluxo completo de registro/login/logout/persistência de sessão.

### [ ] Checkpoint 9 — Frontend: projetos
Listagem/criação de projetos, membros, categorias.
**Pronto quando** (browser): criar projeto, convidar membro, criar categoria.

### [ ] Checkpoint 10 — Frontend: board Kanban completo
Drag-and-drop (`@dnd-kit`), `CardModal` completo com seletor de coluna.
**Pronto quando** (browser): criar/arrastar/editar cards persiste após F5.

### [ ] Checkpoint 11 — Dockerfile multi-stage + Dokploy
Dockerfile 4 stages, ordenação de rotas/estático/fallback SPA no Express, migrations no boot.
**Pronto quando**: `docker build` + `docker run` local funciona ponta a ponta.

### [ ] Checkpoint 12 — Polish, hardening e QA manual final
Error handler consistente, README, estados de loading/empty/erro, checklist de QA manual completo.

## Arquivos críticos

- `apps/api/src/db/schema/index.ts` — schema Drizzle completo.
- `apps/api/src/app.ts` — ordenação de middlewares/rotas/fallback SPA.
- `apps/api/src/middleware/auth.middleware.ts` — leitura/verificação do cookie JWT.
- `packages/shared/src/schemas/*.ts` — contratos Zod compartilhados.
- `Dockerfile` — único artefato de deploy no Dokploy.
