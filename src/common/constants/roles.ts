export const Roles = {
  Admin: "0",
  User: "1",
} as const;

export type Roles = (typeof Roles)[keyof typeof Roles];
