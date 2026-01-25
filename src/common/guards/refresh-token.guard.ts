import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { JwtRefreshPayload } from '../../modules/user-accounts/types/auth.types.js';
import { SessionsService } from '../../modules/user-accounts/application/sessions.service.js';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpCtx = context.switchToHttp();
    const req: Request = httpCtx.getRequest();
    const res: Response = httpCtx.getResponse();

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid authorization method');
    }

    let payload: JwtRefreshPayload;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { sub, deviceId, iat } = payload;

    const isSessionActive = await this.sessionsService.checkSession(sub, deviceId, iat);
    if (!isSessionActive) {
      throw new UnauthorizedException('No active session found');
    }

    res.locals.userId = sub;
    res.locals.deviceId = deviceId;
    return true;
  }
}
