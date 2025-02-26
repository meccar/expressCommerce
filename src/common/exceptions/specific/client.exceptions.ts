import { messages } from "@common/index";
import { HttpException } from "../base/http.exception";
import { statusCodes } from "@common/index";

export class BadRequestException extends HttpException {
  constructor(message?: string) {
    super(statusCodes.BAD_REQUEST, message ?? messages.error.bad_request_400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message?: string) {
    super(statusCodes.UNAUTHORIZED, message ?? messages.error.unauthorized_401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message?: string) {
    super(statusCodes.FORBIDDEN, message ?? messages.error.forbidden_403);
  }
}

export class NotFoundException extends HttpException {
  constructor(message?: string) {
    super(statusCodes.NOT_FOUND, message ?? messages.error.not_found_404);
  }
}
