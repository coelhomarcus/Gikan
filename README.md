# Gikan

Plataforma de Todo/Kanban multi-projeto. Login com registro restrito por código especial, projetos com quadro Kanban (colunas + cards), membros, categorias, responsável, dificuldade e histórico de criação.

Veja [PLAN.md](./PLAN.md) para o histórico completo de checkpoints e decisões técnicas do projeto.

## Stack

- **Backend**: Express + TypeScript (CommonJS) + Drizzle ORM + Zod, em `apps/api`.
- **Frontend**: Vite + React + TypeScript + React Router + Tailwind CSS v4 + Untitled UI (React Aria), em `apps/web`.
- **Compartilhado**: schemas Zod e tipos usados nos dois lados, em `packages/shared`.
- **Banco**: PostgreSQL (externo — você fornece a `DATABASE_URL`).
- **Deploy**: Dockerfile único, backend serve o build do frontend.

## Pré-requisitos

- Node.js 22+
- pnpm 10+ (`corepack enable` já resolve a versão certa via `packageManager` no `package.json`)
- Um PostgreSQL acessível (local via Docker, ou um serviço gerenciado)

## Setup local

1. Instale as dependências do monorepo:

   ```bash
   pnpm install
   ```

2. Copie o `.env.example` para `apps/api/.env` e preencha os valores (veja a tabela de variáveis abaixo). Para desenvolvimento, um Postgres local via Docker resolve:

   ```bash
   docker run --name gikan-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gikan -p 5432:5432 -d postgres:16
   ```

3. Rode as migrations:

   ```bash
   pnpm --filter @gikan/api db:migrate
   ```

4. Suba o backend e o frontend em terminais separados:

   ```bash
   pnpm --filter @gikan/api dev   # http://localhost:3000
   pnpm --filter @gikan/web dev   # http://localhost:5173 (proxy /api -> :3000)
   ```

5. Acesse `http://localhost:5173` e crie sua conta usando o `SPECIAL_REGISTRATION_CODE` que você definiu no `.env`. Se o seu `username` estiver na lista de `ADMIN_USERNAMES`, sua conta já nasce admin.

### Outros comandos úteis

```bash
pnpm -r typecheck                                # typecheck de todos os pacotes
pnpm --filter @gikan/api db:generate        # gera uma nova migration a partir do schema
```

## Variáveis de ambiente

| Nome | Propósito | Exemplo |
|---|---|---|
| `DATABASE_URL` | Connection string do Postgres | `postgres://user:pass@host:5432/gikan` |
| `JWT_SECRET` | Segredo pra assinar o JWT de sessão | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Validade do token/cookie de sessão | `7d` |
| `SPECIAL_REGISTRATION_CODE` | Código exigido no registro de novos usuários | `um-codigo-secreto` |
| `ADMIN_USERNAMES` | Usernames que nascem admin ao se registrar (separados por vírgula) | `coelhomarcus` |
| `PORT` | Porta que o Express escuta | `3000` |
| `NODE_ENV` | `development` em dev, `production` no deploy (afeta o cookie `Secure`) | `production` |

## Build de produção (local)

```bash
pnpm --filter @gikan/web build   # gera apps/web/dist
pnpm --filter @gikan/api build   # gera apps/api/dist (bundle via esbuild)
```

## Deploy com Docker / Dokploy

O `Dockerfile` na raiz builda o frontend e o backend e sobe uma imagem única que roda as migrations no boot e depois inicia o servidor:

```bash
docker build -t gikan .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://... \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e JWT_EXPIRES_IN=7d \
  -e SPECIAL_REGISTRATION_CODE=algum-codigo \
  -e ADMIN_USERNAMES=seu-usuario \
  -e PORT=3000 \
  -e NODE_ENV=production \
  gikan
```

No **Dokploy**: crie uma aplicação a partir do Dockerfile do repositório (sem docker-compose — o Postgres é externo), configure as variáveis de ambiente acima no dashboard, e aponte o domínio pra porta `3000` (ou o valor que você definir em `PORT`).

## Estrutura

```
apps/
├── api/     # Express + Drizzle + Zod, organizado por feature (routes → controller → service)
└── web/     # Vite + React + Tailwind + Untitled UI, features/ (lógica) + pages/ (rotas)
packages/
└── shared/  # schemas Zod e tipos compartilhados
```
