import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { updateLocale, updateMe } from "./users.controller";

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.patch("/me", updateMe);
usersRouter.patch("/me/locale", updateLocale);
