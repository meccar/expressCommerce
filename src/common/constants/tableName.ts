export const TableNames = {
  UserAccount: 'UserAccount',
  UserProfile: 'UserProfile',
} as const;

export type TableNames = (typeof TableNames)[keyof typeof TableNames];
