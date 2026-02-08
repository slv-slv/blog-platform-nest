import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { UsersQueryRepository } from '../infrastructure/sql/users.query-repository.js';
import { JwtService } from '@nestjs/jwt';
import { authConfig } from '../../../config/auth.config.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>,
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
      expiresIn: this.auth.accessTokenExpiresIn,
    });
    return accessToken;
  }

  async generateRefreshToken(userId: string, deviceId: string = crypto.randomUUID()): Promise<string> {
    const jwtRefreshPayload = { sub: userId, deviceId };
    const refreshToken = await this.jwtService.signAsync(jwtRefreshPayload, {
      expiresIn: this.auth.refreshTokenExpiresIn,
    });
    return refreshToken;
  }
}
