import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BlogContentModule } from './modules/blog-content/blog-content.module.js';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ExtractUserId } from './common/middlewares/extract-userid.js';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './common/exception-filters/domain-exception-filter.js';
import { CoreConfig } from './core/core.config.js';
import { CoreModule } from './core/core.module.js';

@Global()
@Module({
  imports: [
    CoreModule,
    JwtModule.registerAsync({
      global: true,
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => ({
        secret: coreConfig.jwtPrivateKey,
      }),
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 10000, limit: 5 }] }),
    BlogContentModule,
    UserAccountsModule,
    NotificationsModule,
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
