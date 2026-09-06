import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
    sub: string;
    username: string;
    isAdmin: boolean;
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
}
