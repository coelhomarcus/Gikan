import { loginSchema, registerSchema } from "@todokanban/shared";
import { asyncHandler } from "../../middleware/async-handler";
import { clearSessionCookie, setSessionCookie } from "../../lib/cookies";
import { getUserById, loginUser, registerUser } from "./auth.service";

export const register = asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const { user, token } = await registerUser(input);
    setSessionCookie(res, token);
    res.status(201).json({ user });
});

export const login = asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const { user, token } = await loginUser(input);
    setSessionCookie(res, token);
    res.json({ user });
});

export const logout = asyncHandler(async (_req, res) => {
    clearSessionCookie(res);
    res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
    const user = await getUserById(req.user!.sub);
    res.json({ user });
});
