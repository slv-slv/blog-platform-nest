import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SETTINGS } from '../../settings.js';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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
