import { HttpStatus } from '@nestjs/common';
import { DomainExceptionCode } from './domain-exception-codes.js';

export abstract class DomainException extends Error {
  protected statusCode: DomainExceptionCode;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  getHttpCode(): HttpStatus {
    switch (this.statusCode) {
      // 404
      case DomainExceptionCode.BLOG_NOT_FOUND:
      case DomainExceptionCode.POST_NOT_FOUND:
      case DomainExceptionCode.COMMENT_NOT_FOUND:
      case DomainExceptionCode.DEVICE_NOT_FOUND:
      case DomainExceptionCode.USER_NOT_FOUND:
        return HttpStatus.NOT_FOUND;

      // 401
      case DomainExceptionCode.CREDENTIALS_INCORRECT:
      case DomainExceptionCode.EMAIL_NOT_CONFIRMED:
      case DomainExceptionCode.SESSION_NOT_ACTIVE:
      case DomainExceptionCode.USER_ALREADY_LOGGED_IN:
        return HttpStatus.UNAUTHORIZED;

      // 403
      case DomainExceptionCode.ACCESS_DENIED:
        return HttpStatus.FORBIDDEN;

      // 400
      case DomainExceptionCode.LOGIN_ALREADY_EXISTS:
      case DomainExceptionCode.EMAIL_ALREADY_EXISTS:
      case DomainExceptionCode.EMAIL_ALREADY_CONFIRMED:
      case DomainExceptionCode.CONFIRMATION_CODE_INVALID:
      case DomainExceptionCode.CONFIRMATION_CODE_EXPIRED:
      case DomainExceptionCode.RECOVERY_CODE_INVALID:
      case DomainExceptionCode.RECOVERY_CODE_EXPIRED:
        return HttpStatus.BAD_REQUEST;

      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}

// Blog content
export class DomainBlogNotFoundException extends DomainException {
  constructor(message = 'Blog not found') {
    super(message);
    this.statusCode = DomainExceptionCode.BLOG_NOT_FOUND;
  }
}

export class DomainPostNotFoundException extends DomainException {
  constructor(message = 'Post not found') {
    super(message);
    this.statusCode = DomainExceptionCode.POST_NOT_FOUND;
  }
}

export class DomainCommentNotFoundException extends DomainException {
  constructor(message = 'Comment not found') {
    super(message);
    this.statusCode = DomainExceptionCode.COMMENT_NOT_FOUND;
  }
}

// Security / sessions
export class DomainDeviceNotFoundException extends DomainException {
  constructor(message = 'Device not found') {
    super(message);
    this.statusCode = DomainExceptionCode.DEVICE_NOT_FOUND;
  }
}

export class DomainSessionNotActiveException extends DomainException {
  constructor(message = 'No active session found') {
    super(message);
    this.statusCode = DomainExceptionCode.SESSION_NOT_ACTIVE;
  }
}

export class DomainUserAlreadyLoggedInException extends DomainException {
  constructor(message = 'The user is already logged in') {
    super(message);
    this.statusCode = DomainExceptionCode.USER_ALREADY_LOGGED_IN;
  }
}

// Users
export class DomainUserNotFoundException extends DomainException {
  constructor(message = 'User not found') {
    super(message);
    this.statusCode = DomainExceptionCode.USER_NOT_FOUND;
  }
}

export class DomainLoginAlreadyExistsException extends DomainException {
  constructor(message = 'Login already exists') {
    super(message);
    this.statusCode = DomainExceptionCode.LOGIN_ALREADY_EXISTS;
  }
}

export class DomainEmailAlreadyExistsException extends DomainException {
  constructor(message = 'Email already exists') {
    super(message);
    this.statusCode = DomainExceptionCode.EMAIL_ALREADY_EXISTS;
  }
}

// Auth
export class DomainCredentialsIncorrectException extends DomainException {
  constructor(message = 'Incorrect login/password') {
    super(message);
    this.statusCode = DomainExceptionCode.CREDENTIALS_INCORRECT;
  }
}

export class DomainEmailNotConfirmedException extends DomainException {
  constructor(message = 'Email has not been confirmed') {
    super(message);
    this.statusCode = DomainExceptionCode.EMAIL_NOT_CONFIRMED;
  }
}

export class DomainEmailAlreadyConfirmedException extends DomainException {
  constructor(message = 'Email already confirmed') {
    super(message);
    this.statusCode = DomainExceptionCode.EMAIL_ALREADY_CONFIRMED;
  }
}

export class DomainConfirmationCodeInvalidException extends DomainException {
  constructor(message = 'Invalid confirmation code') {
    super(message);
    this.statusCode = DomainExceptionCode.CONFIRMATION_CODE_INVALID;
  }
}

export class DomainConfirmationCodeExpiredException extends DomainException {
  constructor(message = 'The confirmation code has expired') {
    super(message);
    this.statusCode = DomainExceptionCode.CONFIRMATION_CODE_EXPIRED;
  }
}

export class DomainRecoveryCodeInvalidException extends DomainException {
  constructor(message = 'Invalid recovery code') {
    super(message);
    this.statusCode = DomainExceptionCode.RECOVERY_CODE_INVALID;
  }
}

export class DomainRecoveryCodeExpiredException extends DomainException {
  constructor(message = 'The recovery code has expired') {
    super(message);
    this.statusCode = DomainExceptionCode.RECOVERY_CODE_EXPIRED;
  }
}

// Access
export class DomainAccessDeniedException extends DomainException {
  constructor(message = 'Access denied') {
    super(message);
    this.statusCode = DomainExceptionCode.ACCESS_DENIED;
  }
}
