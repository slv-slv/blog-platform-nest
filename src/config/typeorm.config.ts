import { config } from 'dotenv';
import { getPostgresConfig } from './postgres.config.js';
import { DataSource } from 'typeorm';

config();

const postgres = getPostgresConfig();

export default new DataSource({
  host: postgres.url,
  port: postgres.port,
  ssl: postgres.ssl,
  username: postgres.user,
  password: postgres.password,
  database: postgres.database,
  type: 'postgres',
  schema: 'typeorm',
  migrations: ['src/migrations/*{.js,.ts}'],
  entities: ['src/**/*.entities.ts'],
  migrationsRun: false,
});
