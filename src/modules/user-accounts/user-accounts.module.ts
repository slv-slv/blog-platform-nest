import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller.js';
import { UsersService } from './application/users.service.js';
import { UsersRepository } from './infrastructure/sql/users.repository.js';
import { UsersQueryRepository } from './infrastructure/sql/users.query-repository.js';
import { AuthController } from './api/auth.controller.js';
import { AuthService } from './application/auth.service.js';
import { NotificationsModule } from '../../notifications/notifications.module.js';
import { SessionsController } from './api/sessions.controller.js';
import { SessionsService } from './application/sessions.service.js';
import { SessionsRepository } from './infrastructure/sql/sessions.repository.js';
import { SessionsQueryRepository } from './infrastructure/sql/sessions.query-repository.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { authConfig } from '../../config/auth.config.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case.js';

@Module({
  imports: [
    NotificationsModule,
    JwtModule.registerAsync({
      global: true,
      inject: [authConfig.KEY],
      useFactory: (auth: ConfigType<typeof authConfig>) => ({
        secret: auth.jwtPrivateKey,
      }),
    }),
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
    CreateUserUseCase,
    GetUsersUseCase,
  ],
  exports: [UsersQueryRepository, UsersRepository],
})
export class UserAccountsModule {}
