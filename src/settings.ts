import dotenv from 'dotenv';
import { PagingParamsType } from './common/types/paging-params.types.js';

dotenv.config();

export const SETTINGS = {
  PORT: process.env.PORT,
  MONGO_SETTINGS: {
    URL: process.env.MONGO_URL!,
    DATABASE: process.env.MONGO_DATABASE!,
  },
  POSTGRES_SETTINGS: {
    CONNECTION_STRING: process.env.POSTGRES_CONNECTION_STRING!,
    URL: process.env.POSTGRES_URL!,
    USER: process.env.POSTGRES_USER!,
    PASSWORD: process.env.POSTGRES_PASSWORD!,
    DATABASE: process.env.POSTGRES_DATABASE!,
    PORT: 5432,
  },
  PAGING_DEFAULT_PARAMS: {
    sortBy: 'createdAt',
    sortDirection: 'desc',
    pageNumber: 1,
    pageSize: 10,
  } as PagingParamsType,
  ADMIN_CREDENTIALS_BASE64: process.env.ADMIN_CREDENTIALS_BASE64,
  EMAIL_CREDENTIALS: { user: process.env.EMAIL_LOGIN_GOOGLE, password: process.env.EMAIL_PASSWORD_GOOGLE },
  SMTP_URL: process.env.SMTP_URL,
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  ACCESS_TOKEN_LIFETIME: '10m' as const,
  REFRESH_TOKEN_LIFETIME: '20m' as const,
  CONFIRMATION_CODE_LIFETIME: 24,
  RECOVERY_CODE_LIFETIME: 24,
  NEWEST_LIKES_NUMBER: 3,
};
