export interface SignInResult {
  succeeded: boolean;
  isLockedOut?: boolean;
  isNotAllowed?: boolean;
  requiresTwoFactor?: boolean;
  message?: string;
}

export interface ExternalLoginInfo {
  loginProvider: string;
  providerKey: string;
  providerDisplayName: string;
  claims?: Array<{ type: string; value: string }>;
}
