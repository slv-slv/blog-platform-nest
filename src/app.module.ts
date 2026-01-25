import {
  BeforeApplicationShutdown,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SETTINGS } from './settings.js';
import { BlogContentModule } from './modules/blog-content/blog-content.module.js';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ExtractUserId } from './common/middlewares/extract-userid.js';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './modules/database/database.module.js';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './common/exception-filters/domain-exception-filter.js';

@Module({
  imports: [
    ConfigModule.forRoot(),

    JwtModule.register({
      global: true,
      secret: SETTINGS.JWT_PRIVATE_KEY,
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 10000, limit: 5 }] }),
    BlogContentModule,
    UserAccountsModule,
    NotificationsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ExtractUserId)
      .forRoutes(
        { path: 'blogs/:blogId/posts', method: RequestMethod.GET },
        { path: 'posts', method: RequestMethod.GET },
        { path: 'posts/:id', method: RequestMethod.GET },
        { path: 'posts/:postId/comments', method: RequestMethod.GET },
        { path: 'comments/:id', method: RequestMethod.GET },
      );
  }
}
