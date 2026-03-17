import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../decorators/public.js';
import { RequestWithOptionalUserId } from '../types/requests.type.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<RequestWithOptionalUserId>();

    const isPublic = this.reflector.getAllAndOverride(Public, [context.getHandler(), context.getClass()]);

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      if (isPublic) {
        req.userId = null;
        return true;
      }
      throw new UnauthorizedException('Authorization header missing');
    }

    const [authMethod, token] = authHeader.split(' ');
    if (authMethod !== 'Bearer' || !token) {
      if (isPublic) {
        req.userId = null;
        return true;
      }
      throw new UnauthorizedException('Invalid authorization method');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(token);
      if (!payload.sub) throw new UnauthorizedException('Missing sub JWT claim');
      req.userId = payload.sub;
    } catch (error) {
      if (isPublic) {
        req.userId = null;
      } else {
        if (error instanceof UnauthorizedException) throw error;
        throw new UnauthorizedException('Invalid access token');
      }
    }

    return true;
  }
}
