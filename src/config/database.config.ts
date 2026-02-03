import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
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
}));
