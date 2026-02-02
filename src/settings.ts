import dotenv from 'dotenv';
import { PagingParamsType } from './common/types/paging-params.types.js';
import { registerAs } from '@nestjs/config';

// dotenv.config();

export const settingsNamespace = registerAs('settings', () => ({
  port: process.env.PORT!,
  mongoSettings: {
    url: process.env.MONGO_URL!,
    database: process.env.MONGO_DATABASE!,
  },
  postgresSettings: {
    connectionString: process.env.POSTGRES_CONNECTION_STRING!,
    url: process.env.POSTGRES_URL!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DATABASE!,
    port: 5432,
  },
  pagingDefaultParams: {
    sortBy: 'createdAt',
    sortDirection: 'desc',
    pageNumber: 1,
    pageSize: 10,
  } as PagingParamsType,
  adminCredentialsBase64: process.env.ADMIN_CREDENTIALS_BASE64!,
  emailCredentials: { user: process.env.EMAIL_LOGIN_GOOGLE!, password: process.env.EMAIL_PASSWORD_GOOGLE! },
  smtpUrl: process.env.SMTP_URL!,
  jwtPrivateKey: process.env.JWT_PRIVATE_KEY!,
  accessTokenLifetime: '10m' as const,
  refreshTokenLifetime: '20m' as const,
  confirmationCodeLifetime: 24,
  recoveryCodeLifetime: 24,
  newestLikesNumber: 3,
}));
