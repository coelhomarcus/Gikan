import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { login, logout, me, register } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
