import { Module } from '@nestjs/common';
import { UsersController } from './01-users/api/users.controller.js';
import { UsersService } from './01-users/application/users.service.js';
import { UsersRepository } from './01-users/repositories/postgresql/users.repository.js';
import { UsersQueryRepository } from './01-users/repositories/postgresql/users.query-repository.js';
// import { MongooseModule } from '@nestjs/mongoose';
// import { User, UserSchema } from './users/repositories/mongoose/users.schemas.js';
// import { Session, SessionSchema } from './sessions/repositories/mongoose/sessions.schemas.js';
import { AuthController } from './03-auth/api/auth.controller.js';
import { AuthService } from './03-auth/application/auth.service.js';
import { NotificationsModule } from '../../notifications/notifications.module.js';
import { SessionsController } from './02-sessions/api/sessions.controller.js';
import { SessionsService } from './02-sessions/application/sessions.service.js';
import { SessionsRepository } from './02-sessions/repositories/postgresql/sessions.repository.js';
import { SessionsQueryRepository } from './02-sessions/repositories/postgresql/sessions.query-repository.js';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './01-users/repositories/typeorm/users.entities.js';
import { Device } from './02-sessions/repositories/typeorm/sessions.entities.js';

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
