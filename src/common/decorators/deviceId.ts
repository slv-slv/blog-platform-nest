import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithSession } from '../types/requests.type.js';

export const DeviceId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithSession>();
  return request.deviceId;
});
