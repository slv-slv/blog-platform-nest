import { BeforeApplicationShutdown, Global, Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { AuthConfig, CoreConfig, DatabaseConfig, EmailConfig } from './core.config.js';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PostgresModule } from '../common/dynamic-modules/postgres.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PG_POOL } from '../common/constants.js';
import { Pool } from 'pg';
import { authSettings, coreSettings, databaseSettings, emailSettings } from '../settings.js';

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
      load: [coreSettings, databaseSettings, authSettings, emailSettings],
    }),
    MongooseModule.forRootAsync({
      inject: [DatabaseConfig],
      useFactory: (databaseConfig: DatabaseConfig) => ({
        uri: databaseConfig.mongoSettings.url,
        dbName: databaseConfig.mongoSettings.database,
      }),
    }),
    PostgresModule.forRootAsync({
      inject: [DatabaseConfig],
      useFactory: (databaseConfig: DatabaseConfig) => ({
        host: databaseConfig.postgresSettings.url,
        user: databaseConfig.postgresSettings.user,
        password: databaseConfig.postgresSettings.password,
        database: databaseConfig.postgresSettings.database,
        ssl: true,
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [DatabaseConfig],
      useFactory: (databaseConfig: DatabaseConfig) => ({
        type: 'postgres',
        host: databaseConfig.postgresSettings.url,
        username: databaseConfig.postgresSettings.user,
        password: databaseConfig.postgresSettings.password,
        schema: 'typeorm',
        database: databaseConfig.postgresSettings.database,
        autoLoadEntities: true,
        synchronize: true,
        ssl: true,
      }),
    }),
  ],
  providers: [CoreConfig, DatabaseConfig, AuthConfig, EmailConfig],
  exports: [CoreConfig, DatabaseConfig, AuthConfig, EmailConfig],
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
