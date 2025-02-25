import { messages } from "@common/index";
import { HttpException } from "../base/http.exception";
export class ValidationException extends HttpException {
  errors: any;
  
  constructor(message: string = messages.error.validation_failed_422, errors?: any) {
    super(422, message);
    this.errors = errors;
  }
}