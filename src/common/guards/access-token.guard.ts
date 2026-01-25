import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Public } from '../decorators/public.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride(Public, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const httpCtx = context.switchToHttp();
    const req: Request = httpCtx.getRequest();
    const res: Response = httpCtx.getResponse();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [authMethod, token] = authHeader.split(' ');
    if (authMethod !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization method');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const { sub } = payload;
      res.locals.userId = sub;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    return true;
  }
}
