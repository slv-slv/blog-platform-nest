import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SETTINGS } from './settings.js';
import { BlogContentModule } from './features/blog-content/blog-content.module.js';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(SETTINGS.MONGO_URL),
    BlogContentModule,
    UserAccountsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
