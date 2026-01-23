import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller.js';
import { UsersService } from './application/users.service.js';
import { UsersRepository } from './infrastructure/postgresql/users.repository.js';
import { UsersQueryRepository } from './infrastructure/postgresql/users.query-repository.js';
import { AuthController } from './api/auth.controller.js';
import { AuthService } from './application/auth.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SessionsController } from './api/sessions.controller.js';
import { SessionsService } from './application/sessions.service.js';
import { SessionsRepository } from './infrastructure/postgresql/sessions.repository.js';
import { SessionsQueryRepository } from './infrastructure/postgresql/sessions.query-repository.js';

@Module({
  imports: [NotificationsModule],
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
