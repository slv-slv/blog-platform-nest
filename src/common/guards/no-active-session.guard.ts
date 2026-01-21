import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { JwtRefreshPayload } from '../../features/types/auth.types.js';
import { SessionsService } from '../../features/application/sessions.service.js';

@Injectable()
export class NoActiveSessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return true;
    }

    let payload: JwtRefreshPayload;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      return true;
    }

    const { sub, deviceId, iat } = payload;

    const isSessionActive = this.sessionsService.checkSession(sub, deviceId, iat);
    if (!isSessionActive) {
      return true;
    }

    throw new UnauthorizedException('The user is already logged in');
  }
}
