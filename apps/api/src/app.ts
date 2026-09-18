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

// Runs behind Dokploy's reverse proxy — without this, the IP-based rate limiter
// would see the proxy's internal IP instead of each client's real IP.
app.set("trust proxy", 1);

// CSP is intentionally disabled: Helmet's default may block the SPA bundle (Vite)
// before each directive has been thoroughly tested. The other protections
// (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS, etc.) are still worthwhile.
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

// Any /api/* route not mapped above -> JSON 404, before the static fallback below
// (otherwise the SPA catch-all would swallow misspelled or unknown API calls).
app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
});

// Resolved from cwd, not __dirname (see the note in db/migrate.ts) — the Dockerfile
// sets WORKDIR=/app/apps/api, so this points to apps/web/dist in both development and production.
const webDist = path.resolve(process.cwd(), "../web/dist");
app.use(express.static(webDist));
app.get("*", (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
});

app.use(errorHandler);
