import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestWithUser } from '../types/requests.type.js';

@Injectable()
export class EmailConfirmationGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;

    if (!user.confirmation.isConfirmed) {
      throw new UnauthorizedException('Email has not been confirmed');
    }

    return true;
  }
}
