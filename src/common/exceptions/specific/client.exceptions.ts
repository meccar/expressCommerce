import { messages } from "@common/index";
import { HttpException } from "../base/http.exception";

export class BadRequestException extends HttpException {
  constructor(message: string = messages.error.bad_request_400) {
    super(400, message);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = messages.error.unauthorized_401) {
    super(401, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = messages.error.forbidden_403) {
    super(403, message);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = messages.error.not_found_404) {
    super(404, message);
  }
}
