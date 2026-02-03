import { registerAs } from '@nestjs/config';

export const mongoConfig = registerAs('database', () => ({
  url: process.env.MONGO_URL,
  database: process.env.MONGO_DATABASE,
}));
