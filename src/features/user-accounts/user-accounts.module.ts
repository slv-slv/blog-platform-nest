import { Module } from '@nestjs/common';
import { UsersController } from './users/api/users.controller.js';
import { UsersService } from './users/application/users.service.js';
import { UsersRepository } from './users/repositories/postgresql/users.repository.js';
import { UsersQueryRepository } from './users/repositories/postgresql/users.query-repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users/repositories/mongoose/users.schemas.js';
import { AuthController } from './auth/api/auth.controller.js';
import { AuthService } from './auth/application/auth.service.js';
import { NotificationsModule } from '../../notifications/notifications.module.js';
import { SessionsController } from './sessions/api/sessions.controller.js';
import { SessionsService } from './sessions/application/sessions.service.js';
import { SessionsRepository } from './sessions/repositories/postgresql/sessions.repository.js';
import { SessionsQueryRepository } from './sessions/repositories/postgresql/sessions.query-repository.js';
import { Session, SessionSchema } from './sessions/repositories/mongoose/sessions.schemas.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
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
