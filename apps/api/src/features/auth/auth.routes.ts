import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { loginRateLimiter, registerRateLimiter } from "../../middleware/rate-limit.middleware";
import { login, logout, me, register } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", registerRateLimiter, register);
authRouter.post("/login", loginRateLimiter, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
