import { UserAccount } from "@modules/index";

export interface AuthenticatedUser extends Omit<UserAccount, 'password'> {
    claims?: Array<{ type: string; value: string }>;
    providers?: Array<{ 
        provider: string; 
        providerKey: string;
        displayName?: string 
    }>;
}