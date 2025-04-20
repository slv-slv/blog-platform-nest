import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service.js';

export class CheckConfirmation implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const res = context.switchToHttp().getResponse();
    const user = res.locals.user;
    const email = user.email;

    const isConfirmed = await this.usersService.isConfirmed(email);
    if (!isConfirmed) {
      throw new UnauthorizedException('Email has not been confirmed');
    }

    return true;
  }
}
