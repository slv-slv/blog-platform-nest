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
    const httpCtx = context.switchToHttp();
    const req: Request = httpCtx.getRequest();
    const res: Response = httpCtx.getResponse();

    const isPublic = this.reflector.getAllAndOverride(Public, [context.getHandler(), context.getClass()]);

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      if (isPublic) {
        res.locals.userId = null;
        return true;
      }
      throw new UnauthorizedException('Authorization header missing');
    }

    const [authMethod, token] = authHeader.split(' ');
    if (authMethod !== 'Bearer' || !token) {
      if (isPublic) {
        res.locals.userId = null;
        return true;
      }
      throw new UnauthorizedException('Invalid authorization method');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (!payload.sub) throw new UnauthorizedException('Missing sub JWT claim');
      res.locals.userId = payload.sub;
    } catch (error) {
      if (isPublic) {
        res.locals.userId = null;
      } else {
        if (error instanceof UnauthorizedException) throw error;
        throw new UnauthorizedException('Invalid access token');
      }
    }

    return true;
  }
}
