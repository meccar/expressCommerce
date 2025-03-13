export const Environments = {
  Production: 'production',
  Development: 'development',
} as const;

export type Environments = (typeof Environments)[keyof typeof Environments];
