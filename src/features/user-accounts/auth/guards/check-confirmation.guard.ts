import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service.js';

export class CheckConfirmation implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const email = user.email;

    const isConfirmed = await this.usersService.isConfirmed(email);
    if (!isConfirmed) {
      throw new UnauthorizedException('Email has not been confirmed');
    }

    return true;
  }
}
