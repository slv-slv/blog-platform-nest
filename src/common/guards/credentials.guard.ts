import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthService } from '../../modules/user-accounts/application/auth.service.js';
import { LoginInputDto, UserModel } from '../../modules/user-accounts/types/users.types.js';
import { RequestWithUser } from '../types/requests.type.js';
import {
  CredentialsIncorrectDomainException,
  UserNotFoundDomainException,
} from '../exceptions/domain-exceptions.js';

@Injectable()
export class CredentialsGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<RequestWithUser>();

    const loginInputDto = plainToInstance(LoginInputDto, req.body);
    const errorsMessages = await validate(loginInputDto);
    if (errorsMessages.length > 0) {
      throw new BadRequestException({ errorsMessages });
    }

    const { loginOrEmail, password } = loginInputDto;

    let user: UserModel;

    try {
      user = await this.authService.validateCredentials(loginOrEmail, password);
    } catch (error) {
      if (
        error instanceof CredentialsIncorrectDomainException ||
        error instanceof UserNotFoundDomainException
      ) {
        throw new UnauthorizedException('Incorrect login/password');
      }
      throw error;
    }

    req.user = user;
    return true;
  }
}
