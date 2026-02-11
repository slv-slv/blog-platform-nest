import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PagingParamsType, SortDirection } from '../common/types/paging-params.types.js';

// Legacy config container kept for experiments. Prefer configs in src/config/*.config.ts.

@Injectable()
export class CoreConfigProvider {
  readonly port: number;
  readonly pagingDefaultParams: PagingParamsType;
  readonly newestLikesNumber: number;

  constructor(private readonly configService: ConfigService) {
    this.port = this.configService.getOrThrow<number>('PORT');
    this.pagingDefaultParams = {
      sortBy: 'createdAt',
      sortDirection: SortDirection.desc,
      pageNumber: 1,
      pageSize: 10,
    };
    this.newestLikesNumber = 3;
  }
}

@Injectable()
export class DatabaseConfigProvider {
  readonly mongo: { url: string; database: string };
  readonly postgres: {
    connectionString: string;
    url: string;
    user: string;
    password: string;
    database: string;
    port: number;
  };

  constructor(private readonly configService: ConfigService) {
    this.mongo = {
      url: this.configService.getOrThrow<string>('MONGO_URL'),
      database: this.configService.getOrThrow<string>('MONGO_DATABASE'),
    };
    this.postgres = {
      connectionString: this.configService.getOrThrow<string>('POSTGRES_CONNECTION_STRING'),
      url: this.configService.getOrThrow<string>('POSTGRES_URL'),
      user: this.configService.getOrThrow<string>('POSTGRES_USER'),
      password: this.configService.getOrThrow<string>('POSTGRES_PASSWORD'),
      database: this.configService.getOrThrow<string>('POSTGRES_DATABASE'),
      port: 5432,
    };
  }
}

@Injectable()
export class EmailConfigProvider {
  readonly emailCredentials: { user: string; password: string };
  readonly smtpUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.emailCredentials = {
      user: this.configService.getOrThrow<string>('EMAIL_LOGIN_GOOGLE'),
      password: this.configService.getOrThrow<string>('EMAIL_PASSWORD_GOOGLE'),
    };
    this.smtpUrl = this.configService.getOrThrow<string>('SMTP_URL');
  }
}
