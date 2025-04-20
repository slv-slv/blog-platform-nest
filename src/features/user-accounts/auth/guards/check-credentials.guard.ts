import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginInputDto } from '../../users/users.types.js';
import { AuthService } from '../auth.service.js';
import { UsersQueryRepository } from '../../users/users.query-repository.js';

@Injectable()
export class CheckCredentials implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const loginInputDto = plainToInstance(LoginInputDto, req.body);
    const errorMessages = await validate(loginInputDto);
    if (errorMessages.length > 0) {
      throw new BadRequestException({ errorMessages });
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
