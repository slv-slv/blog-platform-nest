import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller.js';
import { UsersService } from './application/users.service.js';
import { UsersRepository } from './infrastructure/typeorm/users.repository.js';
import { UsersQueryRepository } from './infrastructure/typeorm/users.query-repository.js';
// import { MongooseModule } from '@nestjs/mongoose';
// import { User, UserSchema } from './infrastructure/mongoose/users.schemas.js';
// import { Session, SessionSchema } from './infrastructure/mongoose/sessions.schemas.js';
import { AuthController } from './api/auth.controller.js';
import { AuthService } from './application/auth.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SessionsController } from './api/sessions.controller.js';
import { SessionsService } from './application/sessions.service.js';
import { SessionsRepository } from './infrastructure/typeorm/sessions.repository.js';
import { SessionsQueryRepository } from './infrastructure/typeorm/sessions.query-repository.js';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './infrastructure/typeorm/users.entities.js';
import { Device } from './infrastructure/typeorm/sessions.entities.js';

@Module({
  imports: [
    // MongooseModule.forFeature([
    //   { name: User.name, schema: UserSchema },
    //   { name: Session.name, schema: SessionSchema },
    // ]),
    TypeOrmModule.forFeature([User, Device]),
    NotificationsModule,
  ],
  controllers: [UsersController, AuthController, SessionsController],
  providers: [
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    AuthService,
    SessionsService,
    SessionsRepository,
    SessionsQueryRepository,
  ],
  exports: [UsersQueryRepository, UsersRepository],
})
export class UserAccountsModule {}
