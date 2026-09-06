import cookieParser from "cookie-parser";
import express from "express";
import { authRouter } from "./features/auth/auth.routes";
import { cardsRouter } from "./features/cards/cards.routes";
import { projectsRouter } from "./features/projects/projects.routes";
import { errorHandler } from "./middleware/error-handler.middleware";

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/cards", cardsRouter);

app.use(errorHandler);
