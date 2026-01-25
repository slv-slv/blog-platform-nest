import { Response } from 'express';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../modules/user-accounts/application/users.service.js';

@Injectable()
export class EmailConfirmationGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const res: Response = context.switchToHttp().getResponse();

    const user = res.locals.user;
    const email = user.email;

    const isConfirmed = await this.usersService.isConfirmed(email);
    if (!isConfirmed) {
      throw new UnauthorizedException('Email has not been confirmed');
    }

    return true;
  }
}
