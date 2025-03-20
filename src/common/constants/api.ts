export const Api = {
  apiRoot: 'api',
  service: {
    userAccount: '/user',
    auth: '/auth',
    admin: '/admin',
    mfa: '/mfa',
    seed: '/seed',
  },
  method: {
    register: '/register',
    login: '/login',
    logout: '/logout',
    refreshToken: '/refresh',
    confirmEmail: '/verify-email',
    resetPassword: '/recover-email',
    rotateKeys: '/rotate-keys',
    generateTwoFactorSecret: '/generate-secret',
    verifyTwoFactorSecret: '/verify-secret',
    validateTwoFactorSecret: '/validate-secret',
    disableTwoFactorSecret: '/disable-secret',
    role: '/role',
    user: '/user',
  },
} as const;

export type Api = (typeof Api)[keyof typeof Api];
