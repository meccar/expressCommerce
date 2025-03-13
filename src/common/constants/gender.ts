export const Gender = {
  Male: 'Male',
  Female: 'Female',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];
