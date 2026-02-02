import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PagingParamsType, SortDirection } from '../common/types/paging-params.types.js';

@Injectable()
export class CoreConfig {
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
export class DatabaseConfig {
  readonly mongoSettings: { url: string; database: string };
  readonly postgresSettings: {
    connectionString: string;
    url: string;
    user: string;
    password: string;
    database: string;
    port: number;
  };

  constructor(private readonly configService: ConfigService) {
    this.mongoSettings = {
      url: this.configService.getOrThrow<string>('MONGO_URL'),
      database: this.configService.getOrThrow<string>('MONGO_DATABASE'),
    };
    this.postgresSettings = {
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
export class AuthConfig {
  readonly adminCredentialsBase64: string;
  readonly jwtPrivateKey: string;
  readonly accessTokenLifetime: string;
  readonly refreshTokenLifetime: string;
  readonly confirmationCodeLifetime: number;
  readonly recoveryCodeLifetime: number;

  constructor(private readonly configService: ConfigService) {
    this.adminCredentialsBase64 = this.configService.getOrThrow<string>('ADMIN_CREDENTIALS_BASE64');
    this.jwtPrivateKey = this.configService.getOrThrow<string>('JWT_PRIVATE_KEY');
    this.accessTokenLifetime = '10m';
    this.refreshTokenLifetime = '20m';
    this.confirmationCodeLifetime = 24;
    this.recoveryCodeLifetime = 24;
  }
}

@Injectable()
export class EmailConfig {
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
