import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtRefreshPayload } from '../../modules/user-accounts/types/auth.types.js';
import { SessionsService } from '../../modules/user-accounts/application/sessions.service.js';
import { RequestWithSession } from '../types/requests.type.js';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<RequestWithSession>();

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

    const { sub, deviceId, jti } = payload;

    const isSessionActive = await this.sessionsService.checkSession(jti);
    if (!isSessionActive) {
      throw new UnauthorizedException('No active session found');
    }

    req.userId = sub;
    req.deviceId = deviceId;
    req.jti = jti;
    return true;
  }
}
