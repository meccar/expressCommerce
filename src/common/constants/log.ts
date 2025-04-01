export const LogAction = {
  ViewDetail: 1,
  ViewField: 2,
  GetOTP: 3,
  Copy: 4,
  Create: 5,
  Update: 6,
  Delete: 7,
  Restore: 8,
};
export type LogAction = (typeof LogAction)[keyof typeof LogAction];

export const LogStatus = {
  NotFound: 1,
  Success: 2,
  Denied: 3,
  WrongOTP: 4,
  MfaFail: 5,
};
export type LogStatus = (typeof LogStatus)[keyof typeof LogStatus];
