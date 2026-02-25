import { DynamicModule, Global, Module, ModuleMetadata } from '@nestjs/common';
import { PG_BASE_CONFIG, PG_POOL } from '../constants.js';
import { Pool, PoolConfig } from 'pg';

type PostgresModuleAsyncOptions = {
  imports?: ModuleMetadata['imports'];
  inject?: any[];
  useFactory: (...args: any[]) => PoolConfig | Promise<PoolConfig>;
};

@Global()
@Module({})
export class PostgresModule {
  static forRoot(pgConfig: PoolConfig): DynamicModule {
    return {
      module: PostgresModule,
      providers: [
        {
          provide: PG_POOL,
          useValue: new Pool(pgConfig),
        },
      ],
      exports: [PG_POOL],
    };
  }

  static forRootAsync(options: PostgresModuleAsyncOptions): DynamicModule {
    return {
      module: PostgresModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: PG_POOL,
          useFactory: async (...args: any[]) => {
            const pgConfig = await options.useFactory(...args);
            return new Pool(pgConfig);
          },
          inject: options.inject ?? [],
        },
      ],
      exports: [PG_POOL],
    };
  }

  // TODO: Внедрить кэш пулов соединений

  // static forRoot(pgBaseConfig: PoolConfig): DynamicModule {
  //   return {
  //     module: PostgresModule,
  //     providers: [
  //       {
  //         provide: PG_BASE_CONFIG,
  //         useValue: pgBaseConfig,
  //       },
  //     ],
  //     exports: [PG_BASE_CONFIG],
  //   };
  // }

  // static forFeature(configOverrides: Partial<PoolConfig>): DynamicModule {
  //   return {
  //     module: PostgresModule,
  //     providers: [
  //       {
  //         provide: PG_POOL,
  //         useFactory: (pgBaseConfig) => {
  //           const pgConfig = { ...pgBaseConfig, ...configOverrides };
  //           return new Pool(pgConfig);
  //         },
  //         inject: [PG_BASE_CONFIG],
  //       },
  //     ],
  //     exports: [PG_POOL],
  //   };
  // }
}
