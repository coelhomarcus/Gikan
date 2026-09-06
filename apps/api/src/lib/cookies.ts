import type { Response } from "express";
import ms from "ms";
import { env } from "../config/env";

const SESSION_COOKIE_NAME = "tk_session";

export function setSessionCookie(res: Response, token: string): void {
    res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ms(env.JWT_EXPIRES_IN as ms.StringValue),
    });
}

export function clearSessionCookie(res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}
