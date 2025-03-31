export const Api = {
  apiRoot: 'api',
  service: {
    userAccount: '/user',
    auth: '/auth',
    admin: '/admin',
    mfa: '/mfa',
    seed: '/seed',
    profile: '/profile',
    log: '/log',
  },
  method: {
    register: '/register',
    login: '/login',
    logout: '/logout',
    refreshToken: '/refresh',
    confirmEmail: '/verify-email',
    verifyToken: '/verify-token',
    resetPassword: '/reset-password',
    requestResetPassword: '/request-reset-password',
    rotateKeys: '/rotate-keys',
    generateTwoFactorSecret: '/generate-secret',
    verifyTwoFactorSecret: '/verify-secret',
    validateTwoFactorSecret: '/validate-secret',
    disableTwoFactorSecret: '/disable-secret',
    role: '/role',
    user: '/create-user',
  },
} as const;

export type Api = (typeof Api)[keyof typeof Api];
