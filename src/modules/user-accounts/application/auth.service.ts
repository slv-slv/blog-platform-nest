import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { UsersRepository } from '../infrastructure/sql/users.repository.js';
import { JwtService } from '@nestjs/jwt';
import { authConfig } from '../../../config/auth.config.js';
import { CredentialsIncorrectDomainException } from '../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async checkCredentials(loginOrEmail: string, password: string): Promise<boolean> {
    try {
      const hash = await this.usersRepository.getPasswordHash(loginOrEmail);
      return await bcrypt.compare(password, hash);
    } catch (error) {
      if (error instanceof CredentialsIncorrectDomainException) {
        return false;
      }

      throw error;
    }
  }

  async generateAcessToken(userId: string): Promise<string> {
    const jwtAccessPayload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(jwtAccessPayload, {
      expiresIn: this.auth.accessTokenExpiresIn,
    });
    return accessToken;
  }

  async generateRefreshToken(userId: string, deviceId: string = crypto.randomUUID()): Promise<string> {
    const jti = crypto.randomUUID();
    const jwtRefreshPayload = { sub: userId, deviceId, jti };
    const refreshToken = await this.jwtService.signAsync(jwtRefreshPayload, {
      expiresIn: this.auth.refreshTokenExpiresIn,
    });
    return refreshToken;
  }
}
