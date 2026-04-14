import { DomainExceptionStatus } from './domain-exception-status.js';

export abstract class DomainException extends Error {
  declare status: DomainExceptionStatus;
  declare field: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Blog content
export class BlogNotFoundDomainException extends DomainException {
  constructor(message = 'Blog not found') {
    super(message);
    this.status = DomainExceptionStatus.BLOG_NOT_FOUND;
  }
}

export class PostNotFoundDomainException extends DomainException {
  constructor(message = 'Post not found') {
    super(message);
    this.status = DomainExceptionStatus.POST_NOT_FOUND;
  }
}

export class CommentNotFoundDomainException extends DomainException {
  constructor(message = 'Comment not found') {
    super(message);
    this.status = DomainExceptionStatus.COMMENT_NOT_FOUND;
  }
}

// Security / sessions
export class DeviceNotFoundDomainException extends DomainException {
  constructor(message = 'Device not found') {
    super(message);
    this.status = DomainExceptionStatus.DEVICE_NOT_FOUND;
  }
}

export class SessionNotActiveDomainException extends DomainException {
  constructor(message = 'No active session found') {
    super(message);
    this.status = DomainExceptionStatus.SESSION_NOT_ACTIVE;
  }
}

export class UserAlreadyLoggedInDomainException extends DomainException {
  constructor(message = 'The user is already logged in') {
    super(message);
    this.status = DomainExceptionStatus.USER_ALREADY_LOGGED_IN;
  }
}

// Users
export class UserNotFoundDomainException extends DomainException {
  constructor(message = 'User not found') {
    super(message);
    this.status = DomainExceptionStatus.USER_NOT_FOUND;
  }
}

export class LoginAlreadyExistsDomainException extends DomainException {
  constructor(message = 'Login already exists') {
    super(message);
    this.status = DomainExceptionStatus.LOGIN_ALREADY_EXISTS;
    this.field = 'login';
  }
}

export class EmailAlreadyExistsDomainException extends DomainException {
  constructor(message = 'Email already exists') {
    super(message);
    this.status = DomainExceptionStatus.EMAIL_ALREADY_EXISTS;
    this.field = 'email';
  }
}

export class IncorrectEmailDomainException extends DomainException {
  constructor(message = 'Incorrect email') {
    super(message);
    this.status = DomainExceptionStatus.INCORRECT_EMAIL;
    this.field = 'email';
  }
}

// Quiz
export class QuestionNotFoundDomainException extends DomainException {
  constructor(message = 'Question not found') {
    super(message);
    this.status = DomainExceptionStatus.QUESTION_NOT_FOUND;
  }
}

export class GameNotFoundDomainException extends DomainException {
  constructor(message = 'Game not found') {
    super(message);
    this.status = DomainExceptionStatus.GAME_NOT_FOUND;
  }
}

export class CannotJoinOwnGameDomainException extends DomainException {
  constructor(message = 'User cannot join his own game') {
    super(message);
    this.status = DomainExceptionStatus.CANNOT_JOIN_OWN_GAME;
  }
}

export class GameIsNotPendingDomainException extends DomainException {
  constructor(message = 'Game is not pending') {
    super(message);
    this.status = DomainExceptionStatus.GAME_IS_NOT_PENDING;
  }
}

export class SecondPlayerAlreadyJoinedDomainException extends DomainException {
  constructor(message = 'Second player already joined') {
    super(message);
    this.status = DomainExceptionStatus.SECOND_PLAYER_ALREADY_JOINED;
  }
}

export class NotEnoughQuestionsToStartGameDomainException extends DomainException {
  constructor(
    requiredQuestionsCount: number,
    message = `At least ${requiredQuestionsCount} questions are required to start the game`,
  ) {
    super(message);
    this.status = DomainExceptionStatus.NOT_ENOUGH_QUESTIONS_TO_START_GAME;
  }
}

// Auth
export class CredentialsIncorrectDomainException extends DomainException {
  constructor(message = 'Incorrect login/password') {
    super(message);
    this.status = DomainExceptionStatus.CREDENTIALS_INCORRECT;
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(message = 'Authentication required') {
    super(message);
    this.status = DomainExceptionStatus.UNAUTHORIZED;
  }
}

export class EmailNotConfirmedDomainException extends DomainException {
  constructor(message = 'Email has not been confirmed') {
    super(message);
    this.status = DomainExceptionStatus.EMAIL_NOT_CONFIRMED;
  }
}

export class EmailAlreadyConfirmedDomainException extends DomainException {
  constructor(message = 'Email already confirmed') {
    super(message);
    this.status = DomainExceptionStatus.EMAIL_ALREADY_CONFIRMED;
    this.field = 'email';
  }
}

export class ConfirmationCodeInvalidDomainException extends DomainException {
  constructor(message = 'Invalid confirmation code') {
    super(message);
    this.status = DomainExceptionStatus.CONFIRMATION_CODE_INVALID;
    this.field = 'code';
  }
}

export class ConfirmationCodeExpiredDomainException extends DomainException {
  constructor(message = 'The confirmation code has expired') {
    super(message);
    this.status = DomainExceptionStatus.CONFIRMATION_CODE_EXPIRED;
    this.field = 'code';
  }
}

export class RecoveryCodeInvalidDomainException extends DomainException {
  constructor(message = 'Invalid recovery code') {
    super(message);
    this.status = DomainExceptionStatus.RECOVERY_CODE_INVALID;
    this.field = 'code';
  }
}

export class RecoveryCodeExpiredDomainException extends DomainException {
  constructor(message = 'The recovery code has expired') {
    super(message);
    this.status = DomainExceptionStatus.RECOVERY_CODE_EXPIRED;
    this.field = 'code';
  }
}

// Access
export class AccessDeniedDomainException extends DomainException {
  constructor(message = 'Access denied') {
    super(message);
    this.status = DomainExceptionStatus.ACCESS_DENIED;
  }
}
