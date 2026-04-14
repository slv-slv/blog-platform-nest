import { registerAs } from '@nestjs/config';
import { plainToInstance, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { ToBoolean } from '../common/decorators/to-boolean.js';
import { validateOrThrow } from './validate-or-throw.js';

class PostgresConfig {
  @IsString()
  @IsNotEmpty()
  declare url: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  declare port: number;

  @IsBoolean()
  @ToBoolean()
  declare ssl: boolean;

  @IsString()
  @IsNotEmpty()
  declare user: string;

  @IsString()
  @IsNotEmpty()
  declare password: string;

  @IsString()
  @IsNotEmpty()
  declare database: string;
}

export function getPostgresConfig() {
  const postgresEnvInput = {
    url: process.env.POSTGRES_URL,
    port: process.env.POSTGRES_PORT,
    ssl: process.env.POSTGRES_SSL,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
  };
  const postgresSettings = plainToInstance(PostgresConfig, postgresEnvInput);
  return validateOrThrow(postgresSettings, 'postgres config');
}

export const postgresConfig = registerAs('postgres', () => getPostgresConfig());
