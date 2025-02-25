import { messages } from "@common/index";
import { HttpException } from "../base/http.exception";
export class InternalServerException extends HttpException {
  constructor(message: string = messages.error.internal_server_error_500) {
    super(500, message);
  }
}