import { Inject, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostgresModule } from '../../common/dynamic-modules/postgres.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SETTINGS } from '../../settings.js';
import { PG_POOL } from '../../common/constants.js';
import { Pool } from 'pg';

@Module({
  imports: [
    MongooseModule.forRoot(SETTINGS.MONGO_URL, { dbName: 'blog-platform' }),
    PostgresModule.forRoot({
      host: SETTINGS.POSTGRES_SETTINGS.URL,
      user: SETTINGS.POSTGRES_SETTINGS.USER,
      password: SETTINGS.POSTGRES_SETTINGS.PASSWORD,
      database: 'blog-platform',
      ssl: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: SETTINGS.POSTGRES_SETTINGS.URL,
      username: SETTINGS.POSTGRES_SETTINGS.USER,
      password: SETTINGS.POSTGRES_SETTINGS.PASSWORD,
      schema: 'typeorm',
      database: 'blog-platform',
      autoLoadEntities: true,
      synchronize: true,
      ssl: true,
    }),
  ],
})
export class DatabaseModule {
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
