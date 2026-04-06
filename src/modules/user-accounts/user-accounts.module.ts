import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './api/users.controller.js';
import { UsersService } from './application/users.service.js';
import { UsersRepository } from './infrastructure/typeorm/users.repository.js';
import { UsersQueryRepository } from './infrastructure/typeorm/users.query-repository.js';
import { AuthController } from './api/auth.controller.js';
import { AuthService } from './application/auth.service.js';
import { NotificationsModule } from '../../notifications/notifications.module.js';
import { SessionsController } from './api/sessions.controller.js';
import { SessionsService } from './application/sessions.service.js';
import { SessionsRepository } from './infrastructure/typeorm/sessions.repository.js';
import { SessionsQueryRepository } from './infrastructure/typeorm/sessions.query-repository.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { authConfig } from '../../config/auth.config.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case.js';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case.js';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case.js';
import { GetDevicesUseCase } from './application/use-cases/get-devices.use-case.js';
import { DeleteOtherDevicesUseCase } from './application/use-cases/delete-other-devices.use-case.js';
import { DeleteDeviceUseCase } from './application/use-cases/delete-device.use-case.js';
import { LogoutUseCase } from './application/use-cases/logout.use-case.js';
import { NewPasswordUseCase } from './application/use-cases/new-password.use-case.js';
import { PasswordRecoveryUseCase } from './application/use-cases/password-recovery.use-case.js';
import { RegistrationConfirmationUseCase } from './application/use-cases/registration-confirmation.use-case.js';
import { RegistrationEmailResendingUseCase } from './application/use-cases/registration-email-resending.use-case.js';
import { Device } from './infrastructure/typeorm/sessions.entities.js';
import { User } from './infrastructure/typeorm/users.entities.js';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([User, Device]),
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
    DeleteUserUseCase,
    GetCurrentUserUseCase,
    GetUsersUseCase,
    GetDevicesUseCase,
    DeleteOtherDevicesUseCase,
    DeleteDeviceUseCase,
    LogoutUseCase,
    NewPasswordUseCase,
    PasswordRecoveryUseCase,
    RegistrationConfirmationUseCase,
    RegistrationEmailResendingUseCase,
  ],
  exports: [UsersQueryRepository, UsersRepository],
})
export class UserAccountsModule {}
