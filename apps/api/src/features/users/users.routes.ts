import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { updateMe } from "./users.controller";

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.patch("/me", updateMe);
