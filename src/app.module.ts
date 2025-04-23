import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SETTINGS } from './settings.js';
import { BlogContentModule } from './features/blog-content/blog-content.module.js';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ExtractUserId } from './common/middlewares/extract-userid.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(SETTINGS.MONGO_URL),
    BlogContentModule,
    UserAccountsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ExtractUserId)
      .forRoutes(
        { path: 'posts{*path}', method: RequestMethod.GET },
        { path: 'comments/:id', method: RequestMethod.GET },
      );
  }
}
