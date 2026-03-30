import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../types/requests.type.js';
import { UserModel } from '../../modules/user-accounts/types/users.types.js';

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): UserModel => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});
