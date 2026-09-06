# Plano — Gikan

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
Gikan/
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

### [x] Checkpoint 7 — Frontend: layout do app + rotas
`lib/api-client.ts` (fetch wrapper, `credentials: include`, lança `ApiError` com `status`/`fields` no formato do backend), `lib/query-client.ts` (`@tanstack/react-query`, instalado agora). `components/layout/{app-shell,sidebar,topbar,auth-layout}.tsx` montados sobre os componentes prontos da Untitled UI (`SidebarNavigationSimple`). `routes.tsx` com as rotas reais (`/`, `/login`, `/register`, `/projects/:projectId`, `/projects/:projectId/settings`, catch-all 404) — páginas ainda placeholder, conteúdo real vem nos Checkpoints 8-10. `main.tsx` atualizado com `QueryClientProvider`.
**Achados/ajustes**: (1) o logo padrão da Untitled UI (`UntitledLogo`) é um SVG desenhado à mão soletrando "Untitled UI" — não dava pra só trocar texto, criei `components/foundations/logo/app-logo.tsx` (marca "TK" + "TodoKanban") e troquei nos dois lugares que usavam o logo antigo (`sidebar-simple.tsx`, `auth-layout.tsx`). (2) O `SidebarNavigationSimple` usa um truque de "spacer invisível" pra reservar espaço pro sidebar fixo — só funciona se o container pai for `flex` (descobri isso quando o conteúdo principal sumiu completamente da tela, sem erro nenhum); corrigido em `app-shell.tsx`. (3) Traduzi a página 404 (que veio em inglês do scaffold) e corrigi um bug nela: o botão "Take me home" chamava `router(-1)` (voltar no histórico) igual ao botão "Go back" — agora navega pra `/`.
**Verificado**: `pnpm --filter web typecheck` limpo; navegação por 5 rotas (`/`, `/login`, `/projects/:id`, 404, e clique no link da sidebar) via Playwright, screenshots confirmam tema dark + sidebar + topbar + logo renderizando corretamente, zero erros de console, navegação client-side confirmada (clique no sidebar não recarrega a página).

### [x] Checkpoint 8 — Frontend: telas de auth
`features/auth/{api.ts, hooks/use-auth.tsx, components/require-auth.tsx}`, `pages/{login-page,register-page}.tsx` reais com `react-hook-form` + `zodResolver` (schemas de `@todokanban/shared`). `useAuth`/`AuthProvider` usa `@tanstack/react-query` (`GET /auth/me` no mount, trata 401 como "sem usuário" em vez de erro). `RequireAuth` redireciona pra `/login` se não autenticado.
**Achado de integração**: os componentes de input da Untitled UI são baseados em React Aria (`onChange(value: string)`, não evento DOM) — `{...register(...)}` do react-hook-form quebraria (`event.target` seria `undefined`). Resolvido criando `components/form/controlled-input.tsx`, um wrapper genérico com `Controller` do RHF que casa perfeitamente com a API baseada em valor do React Aria. Vai ser reaproveitado em todos os formulários dos próximos checkpoints.
`components/layout/sidebar-account.tsx` novo: mostra avatar com iniciais, nome/username e botão de logout no rodapé do sidebar (substituindo o placeholder `showAccountCard={false}` do Checkpoint 7, via slot `featureCard`).
**Verificado via browser (Playwright)**: rota protegida sem sessão → redireciona pra `/login`; registro com código especial errado → mensagem de erro inline no campo; registro correto → redireciona pra `/` com sidebar mostrando nome/usuário; F5 mantém sessão (cookie httpOnly); logout → volta pra `/login`; login de novo → funciona. Sem erros de console reais (só os 401/403 esperados do próprio fluxo, logados pelo browser).

### [x] Checkpoint 9 — Frontend: projetos
`features/projects/{api.ts, hooks/{use-projects,use-project,use-project-members}.ts, components/{project-card,create-project-modal,members-panel}.tsx}`, `features/categories/{api.ts, hooks/use-categories.ts, components/{category-badge,categories-panel}.tsx}`. `pages/projects-page.tsx` real (grid de cards + empty state + modal de criação). `pages/project-settings-page.tsx` real com `Tabs` (Membros/Categorias) da Untitled UI. `pages/project-board-page.tsx` ganhou nome real do projeto + botão de Configurações (o board em si é Checkpoint 10).
Novos componentes genéricos reaproveitáveis: `components/form/controlled-textarea.tsx` (mesmo padrão do `controlled-input.tsx`) e `components/overlay/modal-dialog.tsx` (wrapper de modal com `DialogTrigger`/`ModalOverlay`/`Modal`/`Dialog` da Untitled UI + `CloseButton`, `render props` com `close()`).
**Decisões**: paleta fixa de 8 cores pra categorias (`CATEGORY_COLORS`), badge de categoria feito à mão (borda/ponto na cor hex, já que o `Badge` da lib só aceita um enum fixo de cores semânticas, não hex arbitrário). Permissão de excluir categoria/remover membro decidida no client comparando `category.createdBy`/`member.role` com o usuário logado — só de UI, a autorização real continua sendo garantida pelo backend.
**Verificado via browser (Playwright)**: criar projeto → aparece no grid; abrir o projeto → nome real no Topbar; ir em Configurações → convidar `ana` por username → ela aparece na lista com badge "Membro" (dono vê badge "Owner"); criar categoria "Bug" com cor vermelha → aparece como badge colorido com botão de excluir (dono); logado como `ana` (membro comum) na mesma página → formulário de convite some, botão de excluir na categoria da Diana some, mas a lista de membros/categorias continua visível — confirma que a UI respeita o mesmo modelo de permissão do backend.

### [x] Checkpoint 10 — Frontend: board Kanban completo
`features/board/{api.ts, hooks/{use-board,use-card-detail}.ts, components/{board,column,card-item,card-modal,quick-add-card,add-column-form,difficulty-badge}.tsx}`. `@dnd-kit/core` (`useDraggable`/`useDroppable`, sem `@dnd-kit/sortable`) — mover card entre colunas sempre acrescenta no fim da coluna destino (sem reordenação fina por posição durante o arrasto; reordenar com precisão dá pra fazer só pelo `position` explícito via API, não exposto na UI). Update otimista via React Query (`onMutate` atualiza o cache, `onError` reverte, `onSettled` invalida board + detalhe do card). `CardModal` controlado (sem `DialogTrigger`, `ModalOverlay isOpen` direto) porque abre a partir de estado no componente pai, não de um botão-gatilho interno.
Novo `components/form/controlled-select.tsx` (mesmo padrão dos outros `Controlled*`, mas com `selectedKey`/`onSelectionChange` do React Aria Select em vez de `value`/`onChange`). Sentinela `"__none__"` mapeado pra `null` na hora de submeter, pra permitir desatribuir responsável/categoria pelo Select (que não tem opção nativa de limpar seleção).
**Bug real encontrado e corrigido**: renomear uma coluna (clicar no nome → vira input) não selecionava o texto existente ao focar — digitar rápido inseria os caracteres no início em vez de substituir (ex: "A Fazer" → "BacklogA Fazer" em vez de "Backlog"). Corrigido com `useEffect` chamando `.select()` no input quando entra em modo de edição.
**Verificado via browser (Playwright)**: abrir projeto → vê as 3 colunas seedadas; quick-add cria card na coluna (difficulty "Média" default aparece no card); abrir modal → editar dificuldade/categoria/responsável/coluna → salvar → card reflete tudo (badges + avatar) no board; arrastar card de "A Fazer" pra "Em Progresso" com mouse down/move/up (simulando o `PointerSensor`) → move de fato; **F5 → card continua em "Em Progresso" com todos os campos intactos** (critério principal do checkpoint); excluir coluna com card dentro → bloqueado com a mensagem "Mova os cards antes de excluir a coluna"; renomear coluna → texto pré-selecionado, substitui corretamente.

### [x] Checkpoint 11 — Dockerfile multi-stage + Dokploy
**Resolvida a pendência do Checkpoint 2** sobre `packages/shared` não ter build próprio: em vez de dar um build `tsc` pro shared (que exigiria rebuildar toda vez que os schemas mudassem, mesmo em dev) ou usar `esbuild --packages=external` (que também externaliza pacotes do workspace pnpm por engano — são só symlinks em `node_modules`, então isso quebrava `@todokanban/shared` em runtime), a solução final foi: `apps/api/scripts/build.mjs` monta a lista de `external` do esbuild **dinamicamente a partir de `package.json`**, excluindo qualquer dependência com versão `workspace:*`. Isso bundla/inlina o código do `shared` (sem precisar de build/dist próprio, dev continua igual) enquanto mantém `express`/`pg`/`drizzle-orm`/etc. de fora do bundle (evita o clássico problema de empacotar `pg` com seu require dinâmico de binding nativo opcional).
`apps/api/src/app.ts`: rotas `/api/*` não mapeadas → 404 JSON, **antes** de `express.static(webDist)` + fallback SPA (`app.get("*", ...)`) por último. `apps/api/src/db/migrate.ts` e `app.ts` resolvem caminhos a partir de `process.cwd()` (não `__dirname`) — necessário porque o esbuild achata `src/db/migrate.ts` em `dist/migrate.js`, mudando a profundidade relativa; usando `cwd` e fixando `WORKDIR /app/apps/api` tanto em dev (via `pnpm --filter`) quanto no Dockerfile, os caminhos relativos (`../web/dist`, `drizzle/`) batem nos dois ambientes.
**Dockerfile** (4 stages: `deps` → `build` → `runner`, usando `pnpm deploy --prod --legacy` em vez de copiar `node_modules` manualmente entre stages — evita todo o problema de symlinks quebrados do pnpm ao copiar só parte da árvore entre estágios do Docker; `pnpm deploy` gera uma pasta autocontida com `node_modules` de produção + `dist/` + `drizzle/`). Runner final preserva a estrutura `apps/api/` + `apps/web/dist` como irmãos, igual ao monorepo.
**Achado extra**: `@types/express` estava fixado em `^5.0.0` mas o `express` instalado de fato é `4.x` (runtime real, resolvido por `^4.21.2`) — um mismatch de versão introduzido no Checkpoint 0. Corrigido fixando `@types/express`/`@types/express-serve-static-core` em `^4.17.x`/`^4.19.x` pra bater com o runtime real (o workaround do `asyncHandler<T>` genérico do Checkpoint 3 continua válido e foi mantido, só deixou de ser estritamente necessário pro `req.params`).
**Verificado**: `docker build` completo sem erros; `docker run` conectando no Postgres local via `host.docker.internal` — migrations rodam automaticamente no boot (`node dist/migrate.js && node dist/server.js`), `/api/health` responde, `/` e `/login` servem a SPA corretamente, rota de API inexistente → 404 JSON, registro completo funciona **com cookie `Secure` ativado** (confirma detecção correta de `NODE_ENV=production`), e o app renderiza normalmente no browser direto do container (dark theme, fontes, tudo).

### [x] Checkpoint 12 — Polish, hardening e QA manual final
`README.md` (setup local, variáveis de ambiente, build, deploy no Dokploy, estrutura). Novo `components/feedback/error-message.tsx` reutilizável, aplicado nos estados de erro que faltavam: `ProjectsPage`, `MembersPanel`, `CategoriesPanel`, `Board` (antes só tinham loading/empty, sem tratamento de falha de query).
**Dois bugs reais de responsividade mobile encontrados e corrigidos** (só apareceram testando em viewport de celular, nunca em desktop):
1. `MobileNavigationHeader` (componente da Untitled UI, usado só no header mobile) tinha seu próprio `<UntitledLogo />` hardcoded, separado do logo do sidebar desktop que eu já tinha trocado no Checkpoint 7 — corrigido pra usar o `AppLogo` também.
2. `AppShell` usava `flex` incondicional no container — no mobile, isso espremia o header mobile (que deveria ocupar a largura toda no topo) numa faixa vertical estreita ao lado do conteúdo, porque o resto do sidebar (fixo, só desktop) fica `hidden` mas o container continuava em `flex-row`. Corrigido pra `lg:flex` (empilha normalmente no mobile, vira row só a partir do breakpoint `lg`). Também ajustei o `Topbar` pra truncar o título e não deixar os botões de ação estourarem a tela em telas estreitas (ex: "Novo projeto" ao lado de "Projetos").
**Checklist de QA manual** (executado via browser real + Playwright, cobrindo todos os checkpoints juntos):
- [x] Registrar `coelhomarcus` (em `ADMIN_USERNAMES`) → `is_admin=true`.
- [x] Registrar usuário comum → `is_admin=false`.
- [x] Registro com código especial errado → bloqueado com mensagem clara.
- [x] Criar projeto, convidar segundo usuário, ambos veem o projeto na listagem.
- [x] Criar categorias com paleta de cores fixa.
- [x] Drag-and-drop de card entre colunas + persistência após F5 (reordenação fina por posição dentro da mesma coluna não é exposta na UI, só entre colunas — decisão documentada no Checkpoint 10).
- [x] Editar todos os campos do card (assignee, categoria, dificuldade, coluna) pelo modal, refletido no board.
- [x] Logout/login preserva sessão corretamente (cookie httpOnly, expira conforme `JWT_EXPIRES_IN`).
- [x] Build Docker local sobe e passa pelo fluxo completo com Postgres real (Checkpoint 11).
- [x] Responsividade básica (mobile): login, projetos, board (scroll horizontal de colunas, esperado) e configurações — sem overflow, menu hambúrguer funcional.

**Todos os 12 checkpoints originais do plano estão concluídos.** A partir daqui, os checkpoints seguem pedidos novos do usuário, registrados em `TODO.md` e planejados via Plan Mode.

### [x] Checkpoint 13 — Criação de card via modal completo

Substituído o fluxo antigo (`quick-add-card.tsx`, só título + editar depois) por um único passo: "Adicionar card" abre direto o mesmo `card-modal.tsx` completo usado pra editar, agora dual-mode (`target: {type: "create", columnId} | {type: "edit", cardId}`). `createCardSchema` (`packages/shared/src/schemas/cards.ts`) ganhou `categoryId`/`assigneeId` opcionais e anuláveis (mesmo tratamento que o `updateCardSchema` já tinha); `cards.service.ts#createCard` passou a validar `assigneeId` via `ensureAssigneeIsMember` (reaproveitando a função já existente do `updateCard`). Único campo obrigatório: título.
**Decisão técnica**: em vez de um `useForm<T>` só com `zodResolver`, o modal usa um `Resolver<CardFormValues>` manual (`buildResolver(mode)`) que escolhe entre `createCardSchema`/`updateCardSchema` via `schema.safeParse()` e traduz `ZodError.issues` pro formato `FieldErrors` do react-hook-form — permite um único componente/tipo de formulário servir os dois modos sem conflito de tipos entre os dois schemas.
`column.tsx` perdeu o form inline e ganhou um botão simples "Adicionar card" (`onCreateCard(columnId)` subindo até `board.tsx`, que guarda o alvo do modal como união discriminada). `quick-add-card.tsx` deletado.
**Verificado via browser**: clicar "Adicionar card" abre o modal completo direto (sem passo intermediário); criar só com título → sem erro; criar já definindo categoria/dificuldade/responsável → card aparece no board com os badges corretos.

### [x] Checkpoint 14 — Avatar de perfil via URL

Nova coluna `avatar_url` (nullable) em `users`. Novo schema compartilhado `updateProfileSchema` (`packages/shared/src/schemas/users.ts`): `avatarUrl` aceita URL válida, `null`, ou string vazia (tratada como equivalente a "remover a foto" via `.transform()` — sem isso, `.url()` sozinho rejeitaria `""`, o valor natural de "campo limpo", bloqueando salvar só o nome sem foto). Nova feature `apps/api/src/features/users/*` (`PATCH /api/users/me`). Hidratação de `assignee`/`createdBy`/membros (`cards.service.ts`, `projects.service.ts`) passou a incluir `avatarUrl` nas colunas selecionadas.
Nova página `/settings` (`pages/settings-page.tsx`) com formulário Nome + URL da foto; ícone de engrenagem em `sidebar-account.tsx` linka pra lá. `Avatar` (componente já suportava `src` com fallback pra iniciais) recebe `src={pessoa.avatarUrl ?? undefined}` nos 3 usos reais: sidebar, `members-panel.tsx`, `card-item.tsx`.
**Nota de tipo**: `settings-page.tsx` usa `useForm({...})` sem generic explícito no `zodResolver`, mesmo padrão já usado em `card-modal.tsx` — schemas com `.transform()`/`.default()` têm tipo de entrada e saída diferentes, e passar um generic explícito causa conflito; deixar o TS inferir do `resolver` resolve.
**Verificado via browser**: definir URL de imagem válida em `/settings` → avatar aparece no sidebar, na lista de membros (outra conta vendo) e no card em que a pessoa é responsável; salvar só o nome sem tocar na foto continua funcionando.

### [x] Checkpoint 15 — Context menu customizado (genérico + específico de card)

Novo `components/overlay/context-menu-provider.tsx`, montado uma vez em `main.tsx` envolvendo toda a árvore: um listener `contextmenu` único no `document`. `event.shiftKey` → não faz nada (menu nativo do navegador abre normalmente); senão `preventDefault()` e monta um menu customizado (`position: fixed` nas coordenadas do clique, sem usar `Menu`/`Popover` do React Aria porque eles exigem um `triggerRef` de elemento DOM real, não coordenadas de mouse cruas). Sobre um elemento com `data-card-id]` (escrito por `card-item.tsx` com `data-card-title`/`data-card-description`), adiciona "Copiar card" no topo — copia título+descrição direto pra área de transferência sem abrir o modal.
Novo `lib/dom-clipboard.ts`: helpers puros de seleção/recorte/colagem em `input`/`textarea`, incluindo o truque do setter nativo do protótipo (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` + `dispatchEvent(new Event('input', {bubbles:true}))`) pra inserir texto de um jeito que o React (input controlado) realmente percebe.
**Bug real encontrado e corrigido**: a primeira versão dos helpers de colar/recortar relia em reler `document.activeElement` no momento do clique no item do menu — mas o clique no próprio botão "Colar" já rouba o foco do campo original antes da função rodar, então ela sempre operava no elemento errado (silenciosamente não fazia nada). Corrigido capturando o elemento editável focado **no momento em que o menu abre** (dentro do handler de `contextmenu`, antes de qualquer clique no menu poder mudar o foco) e passando essa referência explícita pras funções de colar/recortar, em vez delas relerem `document.activeElement` sozinhas.
**Verificado via browser (Playwright)**: botão direito solto → menu customizado com Copiar/Recortar/Colar desabilitados sem seleção/foco; selecionar texto num input, botão direito, Copiar → confirmado no clipboard real (`navigator.clipboard.readText()`); Colar um texto previamente copiado num campo vazio → valor aparece de fato no campo; Recortar seleção de um campo e Colar em outro → round-trip completo funciona; botão direito num card → "Copiar card" aparece, copia título sozinho (sem descrição) ou título+descrição (com `\n`) conforme o card tem descrição ou não; Shift+botão direito → menu nativo do Chrome abre normalmente (confirmado via evento sintético, já que o Playwright não propaga `shiftKey` em cliques de mouse simulados).

### [x] Checkpoint 16 — Colunas mais largas

`column.tsx` e `add-column-form.tsx`: `w-72` (288px) → `w-80` (320px) nos dois lugares (precisavam ficar iguais pra não ter salto visual entre a última coluna e o botão "Nova coluna").
**Verificado via browser**: largura real da coluna confirmada em 320px via `getBoundingClientRect()`; scroll horizontal do board continua funcionando normalmente com 3 colunas.

### [x] Checkpoint 17 — Busca funcional (Cmd+K / Ctrl+K, só projetos)

Novo `features/projects/components/project-search-modal.tsx`: modal (mesmo padrão `ModalOverlay`/`Modal`/`Dialog` do `CardModal`) com um `Input` de filtro + lista de `useProjects()` (já em cache do React Query) filtrados client-side por nome; clicar ou apertar Enter no primeiro resultado navega pro board e fecha o modal.
`sidebar.tsx`: `useHotkeys("mod+k", ..., {enableOnFormTags: true})` (react-hotkeys-hook, já instalado — `mod` mapeia sozinho pra Cmd no Mac / Ctrl no Windows-Linux) abre o modal de qualquer tela. `sidebar-simple.tsx` ganhou props opcionais `onSearchClick`/`searchShortcut`: quando `onSearchClick` é passado, o input de busca (antes 100% decorativo) vira `isReadOnly` e um `onFocus` (com `blur()` imediato) o transforma num gatilho em vez de campo de texto real. Label do atalho calculado uma vez via `navigator.userAgent` (`⌘K` no Mac, `Ctrl+K` fora dele) — só decorativo, não afeta o binding real do `mod+k`.
**Observação (não é regressão deste checkpoint)**: nem o `ProjectSearchModal` novo nem o `CardModal` já existente fecham com Escape — comportamento pré-existente do wrapper `components/application/modals/modal.tsx` (`AriaModalOverlay`/`AriaModal` sem `isKeyboardDismissDisabled` explícito), confirmado testando os dois modais lado a lado. Fora do escopo deste checkpoint (não fazia parte do "Pronto quando"); fica registrado aqui caso vire pedido futuro.
**Verificado via browser (Playwright)**: Cmd+K de qualquer tela abre a paleta; digitar filtra os projetos por nome; Enter navega pro board certo e fecha o modal; clicar no input do sidebar também abre o modal; user-agent do Windows → label mostra "Ctrl+K" e `Control+k` abre o modal normalmente.

### [x] Checkpoint 18 — Sidebar lista os projetos com o ativo destacado

`sidebar.tsx`: `useProjects()` alimenta o item "Projetos" com `items: projects.map(p => ({label: p.name, href: `/projects/${p.id}`}))`. Sem projetos, cai de volta pro link simples de sempre (a lógica já existente em `nav-list.tsx` só renderiza o `<details>` colapsável quando `item.items?.length` é verdadeiro).
**Achado da exploração original não se confirmou**: a checagem de auto-abrir do `<details>` em `nav-list.tsx` (`const activeItem = items.find((item) => item.href === activeUrl || item.items?.some((subItem) => subItem.href === activeUrl))`) **já** considerava os filhos, não só o pai — nenhum ajuste foi necessário nesse arquivo, só popular `items` de verdade a partir dos projetos reais.
**Verificado via browser**: com 2 projetos criados, navegar pro board de um deles → sidebar mostra "Projetos" expandido automaticamente, com o projeto atual destacado (`aria-current="page"` + fundo diferenciado) e o outro projeto listado sem destaque.

### [x] Checkpoint 19 — Link de repositório no projeto (criar + editar)

`packages/shared/src/schemas/projects.ts`: `createProjectSchema`/`updateProjectSchema` ganham `repositoryUrl`, mesmo padrão de `updateProfileSchema.avatarUrl` (Checkpoint 14) — aceita URL válida, `null`, ou string vazia (tratada como "sem link" via `.transform()`). Nova coluna `repository_url` (nullable) em `projects` (migration `0002_rare_mandarin.sql`). `createProject` (backend) monta o insert manualmente, então precisou adicionar `repositoryUrl: input.repositoryUrl` explicitamente ali; `updateProject` já espalhava `...input`, pegou o campo de graça.
**Não existia nenhuma UI de "editar projeto" antes disso** — `updateProjectSchema`/`updateProject` já existiam desde o Checkpoint 3 mas nenhum componente do frontend os usava. Criada do zero: nova aba "Geral" (primeira, antes de Membros/Categorias) em `project-settings-page.tsx`, com novo `features/projects/components/project-details-panel.tsx` — dono do projeto edita nome/descrição/link do repositório (`react-hook-form` sem generic explícito no `useForm`, mesmo motivo do `.transform()` já documentado em outros formulários); membro comum vê os três campos como texto somente-leitura (link como `<a target="_blank">` de verdade). Novo hook `useUpdateProject(projectId)` em `use-projects.ts`, invalidando a lista de projetos e a query do projeto individual.
`create-project-modal.tsx` ganhou o campo `repositoryUrl` (opcional). Extra de UX: `project-board-page.tsx` mostra um ícone de link externo no `Topbar` (via `ButtonUtility` com `href`) quando o projeto tem link de repositório cadastrado, abrindo numa nova aba — só aparece quando o campo está preenchido.
**Verificado via browser (Playwright)**: criar projeto com link → salvo e ícone aparece no Topbar do board; criar sem link → funciona normalmente, ícone não aparece; aba "Geral" mostra o valor certo, editar e salvar persiste após reload; URL inválida → erro de validação "URL inválida" exibido no formulário.

## Arquivos críticos

- `apps/api/src/db/schema/index.ts` — schema Drizzle completo.
- `apps/api/src/app.ts` — ordenação de middlewares/rotas/fallback SPA.
- `apps/api/src/middleware/auth.middleware.ts` — leitura/verificação do cookie JWT.
- `packages/shared/src/schemas/*.ts` — contratos Zod compartilhados.
- `apps/web/src/features/board/components/card-modal.tsx` — modal dual-mode (criar/editar card).
- `apps/web/src/components/overlay/context-menu-provider.tsx` — menu de contexto site-wide.
- `apps/web/src/features/projects/components/project-search-modal.tsx` — paleta de busca Cmd+K.
- `apps/web/src/features/projects/components/project-details-panel.tsx` — edição de nome/descrição/link do repositório.
- `Dockerfile` — único artefato de deploy no Dokploy.

### [x] Checkpoint 20 — Rebrand: TodoKanban → Gikan

Nomes de pacote: `todokanban` (raiz) → `gikan`; `@todokanban/{api,web,shared}` → `@gikan/{api,web,shared}` nos 4 `package.json` do monorepo e em todos os ~28 arquivos que importavam de `@todokanban/shared`; `Dockerfile` (3 chamadas `pnpm --filter`) e `apps/api/scripts/build.mjs` (comentário) atualizados junto. `pnpm install` rodado depois pra regenerar o `pnpm-lock.yaml` com os novos nomes — symlinks de workspace (`node_modules/@gikan/shared`) recriados automaticamente.
`README.md`, `.env.example` e o título/diretório-raiz do próprio `PLAN.md`: texto/exemplos trocados pra "Gikan" — inclusive nome de container/imagem Docker de exemplo. **Corpos dos checkpoints antigos (histórico) não foram reescritos** — continuam mencionando `@todokanban/shared`/`tk_session` como estavam de fato construídos na época; só a documentação "viva" (README, título, exemplos) foi atualizada. Não mexeu no `.env` real nem na `DATABASE_URL` de produção.
Cookie de sessão: `SESSION_COOKIE_NAME` (`apps/api/src/lib/cookies.ts`) virou `"gikan_session"` e passou a ser exportado; `auth.middleware.ts` tinha um **segundo literal `"tk_session"` duplicado à mão**, independente da constante — corrigido pra importar `SESSION_COOKIE_NAME` em vez de duplicar a string (bug latente eliminado, não só o rename). Efeito colateral esperado: sessões antigas (inclusive em produção, após o deploy) deixam de ser reconhecidas — usuários precisam logar de novo uma vez.
Logo: novo `components/foundations/logo/gikan-icon.tsx` — o `gikan-logo.svg` que o usuário já tinha na raiz do repo (ícone genérico do SVGRepo, silhueta tipo chama/tocha) inlinado como componente React, com o `fill:#000000` fixo trocado por `fill="currentColor"`. `app-logo.tsx` renomeado pra `gikan-logo.tsx` (`AppLogo` → `GikanLogo`): badge quadrado `bg-brand-solid` agora usa `<GikanIcon className="size-full" />` com `text-white` (herda a cor via `currentColor`) em vez do texto "TK", wordmark "TodoKanban" → "Gikan". As 3 importações existentes (`auth-layout.tsx`, `sidebar-simple.tsx`, `mobile-header.tsx`) atualizadas. Favicon (nunca customizado antes, ainda era o ícone padrão do Vite) agora é `apps/web/public/gikan-icon.svg` (versão standalone com cor fixa `#0070f3`, já que favicon não herda CSS da página); `vite.svg` removido por não ter mais uso.
**Verificado (typecheck + browser)**: `tsc --noEmit` limpo em `api`/`web`/`shared`; título da aba e favicon mostram "Gikan"; login funciona com o cookie `gikan_session` (confirmado via `context.cookies()`); logo com ícone + texto "Gikan" visível e legível tanto no tema escuro quanto no claro (screenshot dos dois, ícone branco sobre badge azul sólido nos dois casos — não depende de token de cor que muda com o tema); busca por "todokanban" no repo inteiro (fora de `node_modules`/lockfile) só retorna as menções históricas dentro dos corpos dos checkpoints antigos do próprio `PLAN.md`, deixadas de propósito.
