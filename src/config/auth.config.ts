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
  declare accessTokenExpiresIn: JwtSignOptions['expiresIn'];

  @IsString()
  @IsNotEmpty()
  declare refreshTokenExpiresIn: JwtSignOptions['expiresIn'];

  @IsInt()
  @Min(1)
  declare confirmationCodeExpiresIn: number;

  @IsInt()
  @Min(1)
  declare recoveryCodeExpiresIn: number;
}

export const authConfig = registerAs('auth', () => {
  const authConfigEnvInput = {
    adminCredentialsBase64: process.env.ADMIN_CREDENTIALS_BASE64,
    jwtPrivateKey: process.env.JWT_PRIVATE_KEY,
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    confirmationCodeExpiresIn: process.env.CONFIRMATION_CODE_EXPIRES_IN,
    recoveryCodeExpiresIn: process.env.RECOVERY_CODE_EXPIRES_IN,
  };

  const authConfigEnv = plainToInstance(AuthConfig, authConfigEnvInput);
  return validateOrThrow(authConfigEnv, 'auth config');
});
