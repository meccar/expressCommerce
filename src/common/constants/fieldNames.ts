export const FieldNames = {
  UserAccount: {
    Email: "email",
    Username: "username",
    Phone: "phone_number",
  },
  UserProfile: {
    Code: "code",
    FirstName: "first_name",
    LastName: "last_name",
  },
} as const;

export type FieldNames = typeof FieldNames[keyof typeof FieldNames]
