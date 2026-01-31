import {
  BeforeApplicationShutdown,
  Global,
  Inject,
  Module,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { CoreConfig } from './core.config.js';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PostgresModule } from '../common/dynamic-modules/postgres.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PG_POOL } from '../common/constants.js';
import { Pool } from 'pg';

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
    }),
    MongooseModule.forRootAsync({
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => ({
        uri: coreConfig.mongoSettings.url,
        dbName: coreConfig.mongoSettings.database,
      }),
    }),
    PostgresModule.forRootAsync({
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => ({
        host: coreConfig.postgresSettings.url,
        user: coreConfig.postgresSettings.user,
        password: coreConfig.postgresSettings.password,
        database: coreConfig.postgresSettings.database,
        ssl: true,
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => ({
        type: 'postgres',
        host: coreConfig.postgresSettings.url,
        username: coreConfig.postgresSettings.user,
        password: coreConfig.postgresSettings.password,
        schema: 'typeorm',
        database: coreConfig.postgresSettings.database,
        autoLoadEntities: true,
        synchronize: true,
        ssl: true,
      }),
    }),
  ],
  providers: [CoreConfig],
  exports: [CoreConfig],
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
