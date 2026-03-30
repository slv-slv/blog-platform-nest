import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUserId } from '../types/requests.type.js';

export const UserId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<RequestWithUserId>();
  return request.userId;
});
