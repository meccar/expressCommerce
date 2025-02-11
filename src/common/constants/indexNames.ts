export const IndexNames = {
  UserAccount: {
    Email: "idx_user_accounts_email",
    Username: "idx_user_accounts_username",
    Phone: "idx_user_accounts_phone",
  },
  UserProfile: {
    Code: "idx_user_profiles_code",
    Name: "idx_user_profiles_name",
    Phone: "idx_user_accounts_phone",
  },
} as const;
