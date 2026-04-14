import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { DomainException } from '../exceptions/domain-exceptions.js';
import { DomainExceptionStatus } from '../exceptions/domain-exception-status.js';

@Catch(DomainException)
export class DomainExceptionFilter extends BaseExceptionFilter {
  catch(domainException: DomainException, host: ArgumentsHost) {
    const httpCode = mapDomainStatusToHttpCode(domainException.status);
    const response =
      httpCode === HttpStatus.BAD_REQUEST
        ? {
            errorsMessages: [{ message: domainException.message, field: domainException.field ?? 'unknown' }],
          }
        : domainException.message;

    const httpException = new HttpException(response, httpCode);
    super.catch(httpException, host);
  }
}

function mapDomainStatusToHttpCode(exceptionStatus: DomainExceptionStatus): HttpStatus {
  switch (exceptionStatus) {
    // 404
    case DomainExceptionStatus.BLOG_NOT_FOUND:
    case DomainExceptionStatus.POST_NOT_FOUND:
    case DomainExceptionStatus.COMMENT_NOT_FOUND:
    case DomainExceptionStatus.DEVICE_NOT_FOUND:
    case DomainExceptionStatus.USER_NOT_FOUND:
    case DomainExceptionStatus.QUESTION_NOT_FOUND:
      return HttpStatus.NOT_FOUND;

    // 401
    case DomainExceptionStatus.CREDENTIALS_INCORRECT:
    case DomainExceptionStatus.UNAUTHORIZED:
    case DomainExceptionStatus.EMAIL_NOT_CONFIRMED:
    case DomainExceptionStatus.SESSION_NOT_ACTIVE:
    case DomainExceptionStatus.USER_ALREADY_LOGGED_IN:
      return HttpStatus.UNAUTHORIZED;

    // 403
    case DomainExceptionStatus.ACCESS_DENIED:
    case DomainExceptionStatus.CANNOT_JOIN_OWN_GAME:
    case DomainExceptionStatus.GAME_IS_NOT_PENDING:
    case DomainExceptionStatus.SECOND_PLAYER_ALREADY_JOINED:
    case DomainExceptionStatus.NOT_ENOUGH_QUESTIONS_TO_START_GAME:
      return HttpStatus.FORBIDDEN;

    // 400
    case DomainExceptionStatus.LOGIN_ALREADY_EXISTS:
    case DomainExceptionStatus.EMAIL_ALREADY_EXISTS:
    case DomainExceptionStatus.INCORRECT_EMAIL:
    case DomainExceptionStatus.EMAIL_ALREADY_CONFIRMED:
    case DomainExceptionStatus.CONFIRMATION_CODE_INVALID:
    case DomainExceptionStatus.CONFIRMATION_CODE_EXPIRED:
    case DomainExceptionStatus.RECOVERY_CODE_INVALID:
    case DomainExceptionStatus.RECOVERY_CODE_EXPIRED:
      return HttpStatus.BAD_REQUEST;

    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
