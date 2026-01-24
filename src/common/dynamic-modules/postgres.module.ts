import { DynamicModule, Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PG_POOL } from '../constants.js';
import { Pool, PoolConfig } from 'pg';

@Global()
@Module({})
export class PostgresModule {
  static forRoot(config: PoolConfig): DynamicModule {
    return {
      module: PostgresModule,
      providers: [
        {
          provide: PG_POOL,
          useValue: new Pool(config),
        },
      ],
      exports: [PG_POOL],
    };
  }
}
