import { ConfigModule } from '@nestjs/config';

export const pgClient = 'pgClient';
export const PG_POOL = 'PG_POOL';
export const PG_BASE_CONFIG = 'PG_BASE_CONFIG';
export const configModule = ConfigModule.forRoot({
  envFilePath: [
    // process.env.ENV_FILE_PATH,
    `.env.development.local`,
    `.env.${process.env.NODE_ENV}.local`,
    `.env.${process.env.NODE_ENV}`,
    `.env.production`,
  ],
});
