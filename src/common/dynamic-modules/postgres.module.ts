import { DynamicModule, Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { pgClient } from '../constants.js';
import { Client, ClientConfig } from 'pg';

@Global()
@Module({})
export class PostgresModule {
  static forRoot(pgBaseConfig: { host: string; user: string; password: string }): DynamicModule {
    return {
      module: PostgresModule,
      providers: [
        {
          provide: 'PG_BASE_CONFIG',
          useValue: pgBaseConfig,
        },
      ],
      exports: ['PG_BASE_CONFIG'],
    };
  }

  static forFeature(database: string): DynamicModule {
    return {
      module: PostgresModule,
      providers: [
        {
          provide: pgClient,
          useFactory: (pgBaseConfig) => new Client({ ...pgBaseConfig, database, ssl: true }),
          inject: ['PG_BASE_CONFIG'],
        },
      ],
      exports: [pgClient],
    };
  }
}
