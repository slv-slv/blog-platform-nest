import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
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

  async generateAcessToken(userId: string): Promise<string> {
    const jwtAccessPayload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(jwtAccessPayload, {
      expiresIn: SETTINGS.ACCESS_TOKEN_LIFETIME,
    });
    return accessToken;
  }

  async generateRefreshToken(userId: string, deviceId: string): Promise<string> {
    const jwtRefreshPayload = { sub: userId, deviceId };
    const refreshToken = await this.jwtService.signAsync(jwtRefreshPayload, {
      expiresIn: SETTINGS.REFRESH_TOKEN_LIFETIME,
    });
    return refreshToken;
  }
}
