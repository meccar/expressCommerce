import { AuthenticatedUser } from "@infrastructure/index";

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export {};