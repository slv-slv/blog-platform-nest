import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SETTINGS } from '../../settings.js';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorators/public.js';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride(Public, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const req: Request = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [authMethod, credsBase64] = authHeader.split(' ');
    const credentials = SETTINGS.CREDENTIALS;

    if (authMethod !== 'Basic') {
      throw new UnauthorizedException('Invalid authorization method');
    }

    if (!credentials.map((user) => user.base64).includes(credsBase64)) {
      throw new UnauthorizedException('Incorrect credentials');
    }

    return true;
  }
}
