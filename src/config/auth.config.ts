import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { validateOrThrow } from './validate-or-throw.js';

class AuthConfigSchema {
  @IsString()
  @IsNotEmpty()
  declare adminCredentialsBase64: string;

  @IsString()
  @IsNotEmpty()
  declare jwtPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  declare accessTokenLifetime: string;

  @IsString()
  @IsNotEmpty()
  declare refreshTokenLifetime: string;

  @IsInt()
  @Min(1)
  declare confirmationCodeLifetime: number;

  @IsInt()
  @Min(1)
  declare recoveryCodeLifetime: number;
}

export const authSettings = registerAs('auth', () => {
  const authConfigEnvInput = {
    adminCredentialsBase64: process.env.ADMIN_CREDENTIALS_BASE64,
    jwtPrivateKey: process.env.JWT_PRIVATE_KEY,
    accessTokenLifetime: '10m',
    refreshTokenLifetime: '20m',
    confirmationCodeLifetime: 24,
    recoveryCodeLifetime: 24,
  };

  const authConfigEnv = plainToInstance(AuthConfigSchema, authConfigEnvInput);
  return validateOrThrow(authConfigEnv, 'auth config');
});
