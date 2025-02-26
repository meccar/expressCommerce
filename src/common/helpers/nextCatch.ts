import { Request, Response, NextFunction } from 'express'

export function nextCatch(action: Function) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
        await action(req, res, next)
        } catch (error) {
        next(error)
        }
    }
}