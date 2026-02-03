import { registerAs } from '@nestjs/config';

export const authSettings = registerAs('auth', () => ({
  adminCredentialsBase64: process.env.ADMIN_CREDENTIALS_BASE64,
  jwtPrivateKey: process.env.JWT_PRIVATE_KEY,
  accessTokenLifetime: '10m' as const,
  refreshTokenLifetime: '20m' as const,
  confirmationCodeLifetime: 24,
  recoveryCodeLifetime: 24,
}));
