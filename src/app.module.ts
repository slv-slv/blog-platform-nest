import {
  BeforeApplicationShutdown,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SETTINGS } from './settings.js';
import { BlogContentModule } from './features/blog-content/blog-content.module.js';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ExtractUserId } from './common/middlewares/extract-userid.js';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { PostgresModule } from './common/dynamic-modules/postgres.module.js';
import { pool } from './common/constants.js';
import { Pool } from 'pg';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(SETTINGS.MONGO_URL, { dbName: 'blog-platform' }),
    PostgresModule.forRoot({
      host: SETTINGS.POSTGRES_SETTINGS.URL,
      user: SETTINGS.POSTGRES_SETTINGS.USER,
      password: SETTINGS.POSTGRES_SETTINGS.PASSWORD,
    }),
    PostgresModule.forFeature('blog-platform'),
    JwtModule.register({
      global: true,
      secret: SETTINGS.JWT_PRIVATE_KEY,
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 10000, limit: 5 }] }),
    BlogContentModule,
    UserAccountsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule, OnApplicationBootstrap, BeforeApplicationShutdown {
  constructor(@Inject(pool) private readonly pool: Pool) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ExtractUserId)
      .forRoutes(
        { path: 'blogs/:blogId/posts', method: RequestMethod.GET },
        { path: 'posts{*path}', method: RequestMethod.GET },
        { path: 'comments/:id', method: RequestMethod.GET },
      );
  }

  async onApplicationBootstrap() {
    try {
      await this.pool.connect();
      console.log('PostgreSQL successfully connected');
    } catch (e) {
      console.error('PostgreSQL connection error:\n', e);
    }
  }

  async beforeApplicationShutdown(signal?: string) {
    await this.pool.end();
  }
}
