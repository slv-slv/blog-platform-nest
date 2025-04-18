import { Module } from '@nestjs/common';
import { UsersController } from './users/users.controller.js';
import { UsersService } from './users/users.service.js';
import { UsersRepository } from './users/users.repository.js';
import { UsersQueryRepository } from './users/users.query-repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users/users.schema.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { SETTINGS } from '../../settings.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: SETTINGS.JWT_PRIVATE_KEY,
    }),
  ],
  controllers: [UsersController, AuthController],
  providers: [UsersService, UsersRepository, UsersQueryRepository, AuthService],
  exports: [UsersQueryRepository, UsersRepository],
})
export class UserAccountsModule {}
