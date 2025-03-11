export interface JwtAccessPayload {
  code: string;
  email: string;
  username: string;
  tokenType: "access";
  claims?: Array<{ type: string; value: string }>;
  providers?: Array<{ provider: string; providerKey: string }>;
  jti: string;
}

export interface JwtRefreshPayload {
  code: string;
  email: string;
  username: string;
  tokenType: "refresh";
  jti: string;
}