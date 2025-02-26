import { messages, statusCodes } from "@common/index";
import { HttpException } from "../base/http.exception";
export class InternalServerException extends HttpException {
  constructor(message?: string) {
    super(statusCodes.INTERNAL_SERVER_ERROR, message ?? messages.error.internal_server_error_500);
  }
}