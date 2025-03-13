export const Api = {
  apiRoot: 'api',
  service: {
    userAccount: '/user',
    auth: '/auth',
    admin: '/admin',
    mfa: '/mfa',
  },
  method: {
    register: '/register',
    login: '/login',
    logout: '/logout',
    refreshToken: '/refresh',
    confirmEmail: '/verify-email',
    rotateKeys: '/rotate-keys',
    generateTwoFactorSecret: '/generate-secret',
    verifyTwoFactorSecret: '/verify-secret',
    validateTwoFactorSecret: '/validate-secret',
    disableTwoFactorSecret: '/disable-secret',
    role: '/role',
  },
} as const;

export type Api = (typeof Api)[keyof typeof Api];
