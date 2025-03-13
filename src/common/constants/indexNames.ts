export const IndexNames = {
  UserAccount: {
    Email: 'email',
    Username: 'username',
    Phone: 'phone',
  },
  UserProfile: {
    Code: 'code',
    Name: 'name',
  },
} as const;

export type IndexNames = (typeof IndexNames)[keyof typeof IndexNames];
