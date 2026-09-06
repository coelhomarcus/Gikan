import cookieParser from "cookie-parser";
import express from "express";
import { authRouter } from "./features/auth/auth.routes";
import { errorHandler } from "./middleware/error-handler.middleware";

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use(errorHandler);
