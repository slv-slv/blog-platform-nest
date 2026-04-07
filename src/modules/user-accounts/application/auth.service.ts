import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { UsersRepository } from '../infrastructure/typeorm/users.repository.js';
import { JwtService } from '@nestjs/jwt';
import { authConfig } from '../../../config/auth.config.js';
import {
  CredentialsIncorrectDomainException,
  UserNotFoundDomainException,
} from '../../../common/exceptions/domain-exceptions.js';
import { UserModel } from '../types/users.types.js';

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

  async validateCredentials(loginOrEmail: string, password: string): Promise<UserModel> {
    const user = await this.usersRepository.findUser(loginOrEmail);
    if (!user) {
      throw new UserNotFoundDomainException();
    }

    const isCorrect = await bcrypt.compare(password, user.hash);
    if (!isCorrect) {
      throw new CredentialsIncorrectDomainException();
    }

    return user;
  }

  async generateAccessToken(userId: string): Promise<string> {
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
