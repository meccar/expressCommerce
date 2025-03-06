import { IdentityError } from "./identityError";

export class IdentityResult {
    private _succeeded: boolean;
    private _errors: IdentityError[];

    private constructor(succeeded: boolean, errors: IdentityError[] = []) {
        this._succeeded = succeeded;
        this._errors = errors;
    }

    public get succeeded(): boolean {
        return this._succeeded;
    }

    public get errors(): IdentityError[] {
        return this._errors;
    }

    public static get Success(): IdentityResult {
        return new IdentityResult(true);
    }

    public static Error(...errors: IdentityError[]): IdentityResult {
        return new IdentityResult(false, errors);
    }
}