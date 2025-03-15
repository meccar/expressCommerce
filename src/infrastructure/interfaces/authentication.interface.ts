import { UserAccount } from '@modules/index';

export interface IAuthenticatedUser extends Omit<UserAccount, 'password'> {
  claims?: IUserClaim[];
  providers?: IUserProvider[];
}

export interface IUserClaim {
  type: string;
  value: string;
}

export interface IUserProvider {
  provider: string;
  providerKey: string;
  name?: string;
}
