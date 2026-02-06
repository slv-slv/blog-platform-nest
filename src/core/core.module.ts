import { BeforeApplicationShutdown, Global, Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PostgresModule } from '../common/dynamic-modules/postgres.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PG_POOL } from '../common/constants.js';
import { Pool } from 'pg';
import { authConfig } from '../config/auth.config.js';
import { coreConfig } from '../config/core.config.js';
import { emailConfig } from '../config/email.config.js';
import { mongoConfig } from '../config/mongo.config.js';
import { postgresConfig } from '../config/postgres.config.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        // process.env.ENV_FILE_PATH,
        `.env.development.local`,
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        `.env.production`,
      ],
      load: [coreConfig, mongoConfig, postgresConfig, authConfig, emailConfig],
    }),
    MongooseModule.forRootAsync({
      inject: [mongoConfig.KEY],
      useFactory: (mongo: ConfigType<typeof mongoConfig>) => ({
        uri: mongo.url,
        dbName: mongo.database,
      }),
    }),
    PostgresModule.forRootAsync({
      inject: [postgresConfig.KEY],
      useFactory: (postgres: ConfigType<typeof postgresConfig>) => ({
        host: postgres.url,
        user: postgres.user,
        password: postgres.password,
        database: postgres.database,
        ssl: true,
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [postgresConfig.KEY],
      useFactory: (postgres: ConfigType<typeof postgresConfig>) => ({
        type: 'postgres',
        host: postgres.url,
        username: postgres.user,
        password: postgres.password,
        schema: 'typeorm',
        database: postgres.database,
        autoLoadEntities: true,
        synchronize: true,
        ssl: true,
      }),
    }),
  ],
})
export class CoreModule implements OnApplicationBootstrap, BeforeApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const client = await this.pool.connect();
      client.release();
      console.log('PostgreSQL successfully connected');
    } catch (e) {
      console.error('PostgreSQL connection error:\n', e);
    }
  }

  async beforeApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
