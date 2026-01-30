import { Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PagingParamsType, SortDirection } from './common/types/paging-params.types.js';

@Global()
@Injectable()
export class AppConfig {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return this.configService.getOrThrow<number>('PORT');
  }

  get mongoSettings() {
    return {
      url: this.configService.getOrThrow<string>('MONGO_URL'),
      database: this.configService.getOrThrow<string>('MONGO_DATABASE'),
    };
  }

  get postgresSettings() {
    return {
      connectionString: this.configService.getOrThrow<string>('POSTGRES_CONNECTION_STRING'),
      url: this.configService.getOrThrow<string>('POSTGRES_URL'),
      user: this.configService.getOrThrow<string>('POSTGRES_USER'),
      password: this.configService.getOrThrow<string>('POSTGRES_PASSWORD'),
      database: this.configService.getOrThrow<string>('POSTGRES_DATABASE'),
      port: 5432,
    };
  }

  get pagingDefaultParams(): PagingParamsType {
    return {
      sortBy: 'createdAt',
      sortDirection: SortDirection.desc,
      pageNumber: 1,
      pageSize: 10,
    };
  }

  get adminCredentialsBase64(): string {
    return this.configService.getOrThrow<string>('ADMIN_CREDENTIALS_BASE64');
  }

  get emailCredentials() {
    return {
      user: this.configService.getOrThrow<string>('EMAIL_LOGIN_GOOGLE'),
      password: this.configService.getOrThrow<string>('EMAIL_PASSWORD_GOOGLE'),
    };
  }

  get smtpUrl(): string {
    return this.configService.getOrThrow<string>('SMTP_URL');
  }

  get jwtPrivateKey(): string {
    return this.configService.getOrThrow<string>('JWT_PRIVATE_KEY');
  }

  get accessTokenLifetime(): string {
    return '10m';
  }

  get refreshTokenLifetime(): string {
    return '20m';
  }

  get confirmationCodeLifetime(): number {
    return 24;
  }

  get recoveryCodeLifetime(): number {
    return 24;
  }

  get newestLikesNumber(): number {
    return 3;
  }
}
