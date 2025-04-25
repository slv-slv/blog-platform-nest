import { Module } from '@nestjs/common';
import { UsersController } from './users/users.controller.js';
import { UsersService } from './users/users.service.js';
import { UsersRepository } from './users/users.repository.js';
import { UsersQueryRepository } from './users/users.query-repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users/users.schemas.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { NotificationsModule } from '../../notifications/notifications.module.js';
import { SessionsController } from './sessions/sessions.controller.js';
import { SessionsService } from './sessions/sessions.service.js';
import { SessionsRepository } from './sessions/sessions.repository.js';
import { SessionsQueryRepository } from './sessions/sessions.query-repository.js';
import { Session, SessionSchema } from './sessions/sessions-schemas.js';

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
