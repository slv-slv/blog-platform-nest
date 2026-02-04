import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { validateOrThrow } from './validate-or-throw.js';

class MongoConfig {
  @IsString()
  @IsNotEmpty()
  declare url: string;

  @IsString()
  @IsNotEmpty()
  declare database: string;
}

export const mongoConfig = registerAs('mongo', () => {
  const mongoConfigEnvInput = {
    url: process.env.MONGO_URL,
    database: process.env.MONGO_DATABASE,
  };

  const mongoConfigEnv = plainToInstance(MongoConfig, mongoConfigEnvInput);
  return validateOrThrow(mongoConfigEnv, 'mongo config');
});
