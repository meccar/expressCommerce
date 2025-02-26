import { messages, statusCodes } from "@common/index";
import { HttpException } from "../base/http.exception";
export class ValidationException extends HttpException {
  errors: any;
  
  constructor(message?: string, errors?: any) {
    super(statusCodes.VALIDATION_FAILED, message ?? messages.error.validation_failed_422);
    this.errors = errors;
  }
}