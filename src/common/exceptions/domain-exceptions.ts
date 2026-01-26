import { HttpStatus } from '@nestjs/common';
import { DomainExceptionStatus } from './domain-exception-codes.js';

export abstract class DomainException extends Error {
  protected statusCode: DomainExceptionStatus;
  field?: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  getHttpCode(): HttpStatus {
    switch (this.statusCode) {
      // 404
      case DomainExceptionStatus.BLOG_NOT_FOUND:
      case DomainExceptionStatus.POST_NOT_FOUND:
      case DomainExceptionStatus.COMMENT_NOT_FOUND:
      case DomainExceptionStatus.DEVICE_NOT_FOUND:
      case DomainExceptionStatus.USER_NOT_FOUND:
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
}

// Blog content
export class BlogNotFoundDomainException extends DomainException {
  constructor(message = 'Blog not found') {
    super(message);
    this.statusCode = DomainExceptionStatus.BLOG_NOT_FOUND;
  }
}

export class PostNotFoundDomainException extends DomainException {
  constructor(message = 'Post not found') {
    super(message);
    this.statusCode = DomainExceptionStatus.POST_NOT_FOUND;
  }
}

export class CommentNotFoundDomainException extends DomainException {
  constructor(message = 'Comment not found') {
    super(message);
    this.statusCode = DomainExceptionStatus.COMMENT_NOT_FOUND;
  }
}

// Security / sessions
export class DeviceNotFoundDomainException extends DomainException {
  constructor(message = 'Device not found') {
    super(message);
    this.statusCode = DomainExceptionStatus.DEVICE_NOT_FOUND;
  }
}

export class SessionNotActiveDomainException extends DomainException {
  constructor(message = 'No active session found') {
    super(message);
    this.statusCode = DomainExceptionStatus.SESSION_NOT_ACTIVE;
  }
}

export class UserAlreadyLoggedInDomainException extends DomainException {
  constructor(message = 'The user is already logged in') {
    super(message);
    this.statusCode = DomainExceptionStatus.USER_ALREADY_LOGGED_IN;
  }
}

// Users
export class UserNotFoundDomainException extends DomainException {
  constructor(message = 'User not found') {
    super(message);
    this.statusCode = DomainExceptionStatus.USER_NOT_FOUND;
  }
}

export class LoginAlreadyExistsDomainException extends DomainException {
  constructor(message = 'Login already exists') {
    super(message);
    this.statusCode = DomainExceptionStatus.LOGIN_ALREADY_EXISTS;
    this.field = 'login';
  }
}

export class EmailAlreadyExistsDomainException extends DomainException {
  constructor(message = 'Email already exists') {
    super(message);
    this.statusCode = DomainExceptionStatus.EMAIL_ALREADY_EXISTS;
    this.field = 'email';
  }
}

export class IncorrectEmailDomainException extends DomainException {
  constructor(message = 'Incorrect email') {
    super(message);
    this.statusCode = DomainExceptionStatus.INCORRECT_EMAIL;
    this.field = 'email';
  }
}

// Auth
export class CredentialsIncorrectDomainException extends DomainException {
  constructor(message = 'Incorrect login/password') {
    super(message);
    this.statusCode = DomainExceptionStatus.CREDENTIALS_INCORRECT;
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(message = 'Authentication required') {
    super(message);
    this.statusCode = DomainExceptionStatus.UNAUTHORIZED;
  }
}

export class EmailNotConfirmedDomainException extends DomainException {
  constructor(message = 'Email has not been confirmed') {
    super(message);
    this.statusCode = DomainExceptionStatus.EMAIL_NOT_CONFIRMED;
  }
}

export class EmailAlreadyConfirmedDomainException extends DomainException {
  constructor(message = 'Email already confirmed') {
    super(message);
    this.statusCode = DomainExceptionStatus.EMAIL_ALREADY_CONFIRMED;
    this.field = 'email';
  }
}

export class ConfirmationCodeInvalidDomainException extends DomainException {
  constructor(message = 'Invalid confirmation code') {
    super(message);
    this.statusCode = DomainExceptionStatus.CONFIRMATION_CODE_INVALID;
    this.field = 'code';
  }
}

export class ConfirmationCodeExpiredDomainException extends DomainException {
  constructor(message = 'The confirmation code has expired') {
    super(message);
    this.statusCode = DomainExceptionStatus.CONFIRMATION_CODE_EXPIRED;
    this.field = 'code';
  }
}

export class RecoveryCodeInvalidDomainException extends DomainException {
  constructor(message = 'Invalid recovery code') {
    super(message);
    this.statusCode = DomainExceptionStatus.RECOVERY_CODE_INVALID;
    this.field = 'code';
  }
}

export class RecoveryCodeExpiredDomainException extends DomainException {
  constructor(message = 'The recovery code has expired') {
    super(message);
    this.statusCode = DomainExceptionStatus.RECOVERY_CODE_EXPIRED;
    this.field = 'code';
  }
}

// Access
export class AccessDeniedDomainException extends DomainException {
  constructor(message = 'Access denied') {
    super(message);
    this.statusCode = DomainExceptionStatus.ACCESS_DENIED;
  }
}
