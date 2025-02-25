export interface ErrorResponse {
  status: number;
  message: string;
  stack?: string;
  errors?: any;
  timestamp: string;
  path: string;
  method: string;
}