import path from "path";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { adminRouter } from "./features/admin/admin.routes";
import { authRouter } from "./features/auth/auth.routes";
import { cardsRouter } from "./features/cards/cards.routes";
import { projectsRouter } from "./features/projects/projects.routes";
import { usersRouter } from "./features/users/users.routes";
import { errorHandler } from "./middleware/error-handler.middleware";

export const app = express();

// Roda atrás do reverse proxy do Dokploy — sem isso, o rate limiter (baseado em IP)
// enxergaria o IP interno do proxy em vez do IP real do cliente pra todo mundo.
app.set("trust proxy", 1);

// CSP desligada de propósito: a default do helmet pode bloquear o bundle da SPA (Vite)
// sem termos testado cada diretiva a fundo. As outras proteções (X-Content-Type-Options,
// X-Frame-Options, Referrer-Policy, HSTS, etc.) já valem a pena sem esse risco.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);

// Qualquer rota /api/* não mapeada acima -> 404 JSON, antes do fallback estático abaixo
// (senão o catch-all da SPA engoliria chamadas de API com typo/rota inexistente).
app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Rota de API não encontrada" });
});

// Resolvido a partir do cwd, não de __dirname (ver nota em db/migrate.ts) — o Dockerfile
// seta WORKDIR=/app/apps/api, então isso aponta pra apps/web/dist tanto em dev quanto prod.
const webDist = path.resolve(process.cwd(), "../web/dist");
app.use(express.static(webDist));
app.get("*", (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
});

app.use(errorHandler);
