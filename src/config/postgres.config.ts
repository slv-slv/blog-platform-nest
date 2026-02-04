import { registerAs } from '@nestjs/config';
import { plainToInstance, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { validateOrThrow } from './validate-or-throw.js';

class PostgresConfig {
  @IsString()
  @IsNotEmpty()
  declare connectionString: string;

  @IsString()
  @IsNotEmpty()
  declare url: string;

  @IsString()
  @IsNotEmpty()
  declare user: string;

  @IsString()
  @IsNotEmpty()
  declare password: string;

  @IsString()
  @IsNotEmpty()
  declare database: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  declare port: number;
}

export const postgresConfig = registerAs('postgres', () => {
  const postgresConfigEnvInput = {
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
    url: process.env.POSTGRES_URL,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: 5432,
  };

  const postgresConfigEnv = plainToInstance(PostgresConfig, postgresConfigEnvInput);
  return validateOrThrow(postgresConfigEnv, 'postgres config');
});
