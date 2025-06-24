import { Request, Response } from 'express';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthService } from '../../features/user-accounts/03-auth/application/auth.service.js';
import { UsersQueryRepository } from '../../features/user-accounts/01-users/repositories/postgresql/users.query-repository.js';
import { LoginInputDto } from '../../features/user-accounts/01-users/types/users.types.js';

@Injectable()
export class CredentialsGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();

    const loginInputDto = plainToInstance(LoginInputDto, req.body);
    const errorsMessages = await validate(loginInputDto);
    if (errorsMessages.length > 0) {
      throw new BadRequestException({ errorsMessages });
    }

    const { loginOrEmail, password } = loginInputDto;

    const isCorrect = await this.authService.checkCredentials(loginOrEmail, password);
    if (!isCorrect) {
      throw new UnauthorizedException('Incorrect login/password');
    }

    const user = await this.usersQueryRepository.findUser(loginOrEmail);
    res.locals.user = user;

    return true;
  }
}
