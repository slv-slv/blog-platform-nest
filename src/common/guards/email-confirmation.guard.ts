import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../modules/user-accounts/application/users.service.js';
import { RequestWithUser } from '../types/requests.type.js';

@Injectable()
export class EmailConfirmationGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    const user = req.user;
    const email = user.email;

    const isConfirmed = await this.usersService.isConfirmed(email);
    if (!isConfirmed) {
      throw new UnauthorizedException('Email has not been confirmed');
    }

    return true;
  }
}
