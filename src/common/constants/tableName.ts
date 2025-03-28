export const TableNames = {
  UserAccount: 'user-account',
  UserProfile: 'user-profile',
  UserRole: 'user-role',
  Role: 'role',
  UserClaim: 'user-claim',
  UserToken: 'user-token',
  RoleClaim: 'role-claim',
  UserLogin: 'user-login',
  LogAudit: 'log-audit',
  LogActivity: 'log-activity',
  LogSystem: 'log-system',
} as const;

export type TableNames = (typeof TableNames)[keyof typeof TableNames];
