import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsBase64, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { validateOrThrow } from './validate-or-throw.js';
import type { JwtSignOptions } from '@nestjs/jwt';

class AuthConfig {
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  declare adminCredentialsBase64: string;

  @IsString()
  @IsNotEmpty()
  declare jwtPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  declare accessTokenLifetime: JwtSignOptions['expiresIn'];

  @IsString()
  @IsNotEmpty()
  declare refreshTokenLifetime: JwtSignOptions['expiresIn'];

  @IsInt()
  @Min(1)
  declare confirmationCodeLifetime: number;

  @IsInt()
  @Min(1)
  declare recoveryCodeLifetime: number;
}

export const authConfig = registerAs('auth', () => {
  const authConfigEnvInput = {
    adminCredentialsBase64: process.env.ADMIN_CREDENTIALS_BASE64,
    jwtPrivateKey: process.env.JWT_PRIVATE_KEY,
    accessTokenLifetime: '10m',
    refreshTokenLifetime: '20m',
    confirmationCodeLifetime: 24,
    recoveryCodeLifetime: 24,
  };

  const authConfigEnv = plainToInstance(AuthConfig, authConfigEnvInput);
  return validateOrThrow(authConfigEnv, 'auth config');
});
