import { registerAs } from '@nestjs/config';

export const mongoConfig = registerAs('mongo', () => ({
  url: process.env.MONGO_URL,
  database: process.env.MONGO_DATABASE,
}));
