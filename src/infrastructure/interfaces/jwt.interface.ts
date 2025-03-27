import { JwtPayload } from 'jsonwebtoken';

export interface JwtAccessPayload extends JwtPayload {
  code: string;
  username: string;
  tokenType: 'access';
  tokenCode: string;
  persistent: boolean;
  claims?: Array<{ type: string; value: string }>;
  providers?: Array<{ provider: string; providerKey: string }>;
  // jti: string;
}

export interface JwtRefreshPayload extends JwtPayload {
  code: string;
  username: string;
  tokenType: 'refresh';
  tokenCode: string;
  persistent: boolean;
  // jti: string;
}
