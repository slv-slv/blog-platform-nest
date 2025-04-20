import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { UsersQueryRepository } from '../users/users.query-repository.js';
import { JwtAcessPayload, JwtPairType, JwtRefreshPayload } from './auth.types.js';
import { SETTINGS } from '../../../settings.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async checkCredentials(loginOrEmail: string, password: string): Promise<boolean> {
    const hash = await this.usersQueryRepository.getPasswordHash(loginOrEmail);
    if (!hash) {
      return false;
    }
    return await bcrypt.compare(password, hash);
  }

  async generateJwtPair(userId: string, deviceId: string): Promise<JwtPairType> {
    const jwtAccessPayload = { userId };
    const jwtRefreshPayload = { userId, deviceId };

    const accessToken = this.jwtService.sign(jwtAccessPayload, { expiresIn: SETTINGS.ACCESS_TOKEN_LIFETIME });
    const refreshToken = this.jwtService.sign(jwtRefreshPayload, {
      expiresIn: SETTINGS.REFRESH_TOKEN_LIFETIME,
    });

    return { accessToken, refreshToken };
  }

  verifyJwt(token: string): JwtAcessPayload | JwtRefreshPayload | null {
    try {
      return this.jwtService.verify(token) as JwtAcessPayload | JwtRefreshPayload;
    } catch {
      return null;
    }
  }
}
