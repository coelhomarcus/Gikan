import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

type AsyncRouteHandler<P = ParamsDictionary> = (req: Request<P>, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler<P = ParamsDictionary>(fn: AsyncRouteHandler<P>) {
    return (req: Request<P>, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
}
