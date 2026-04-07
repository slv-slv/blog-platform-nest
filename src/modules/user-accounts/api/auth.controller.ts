import { Response } from 'express';
import { Body, Controller, Get, Headers, HttpCode, Inject, Ip, Post, Res, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigType } from '@nestjs/config';
import {
  CreateUserInputDto,
  CurrentUserViewModel,
  EmailInputDto,
  NewPasswordInputDto,
  UserViewModel,
} from '../types/users.types.js';
import { AuthService } from '../application/auth.service.js';
import { CredentialsGuard } from '../../../common/guards/credentials.guard.js';
import { EmailConfirmationGuard } from '../../../common/guards/email-confirmation.guard.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard.js';
import { NoActiveSessionGuard } from '../../../common/guards/no-active-session.guard.js';
import { User } from '../../../common/decorators/user.js';
import { UserId } from '../../../common/decorators/userId.js';
import { DeviceId } from '../../../common/decorators/deviceId.js';
import { LoginCommand } from '../application/use-cases/login.use-case.js';
import { LogoutCommand } from '../application/use-cases/logout.use-case.js';
import { NewPasswordCommand } from '../application/use-cases/new-password.use-case.js';
import { PasswordRecoveryCommand } from '../application/use-cases/password-recovery.use-case.js';
import { RefreshTokenCommand } from '../application/use-cases/refresh-token.use-case.js';
import { RegistrationConfirmationCommand } from '../application/use-cases/registration-confirmation.use-case.js';
import { RegistrationEmailResendingCommand } from '../application/use-cases/registration-email-resending.use-case.js';
import { RegisterUserCommand } from '../application/use-cases/register-user.use-case.js';
import { GetCurrentUserQuery } from '../application/use-cases/get-current-user.use-case.js';
import { authConfig } from '../../../config/auth.config.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>,
  ) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(NoActiveSessionGuard, CredentialsGuard, EmailConfirmationGuard)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Headers('User-Agent') userAgent: string,
    @User() user: UserViewModel,
    @Ip() ip: string,
  ): Promise<{ accessToken: string }> {
    const userId = user.id;
    const deviceName = userAgent ?? 'unknown';

    const { accessToken, refreshToken } = await this.commandBus.execute(
      new LoginCommand({
        userId,
        ip,
        deviceName,
      }),
    );

    res.cookie('refreshToken', refreshToken, {
      maxAge: this.auth.refreshTokenCookieMaxAgeMs,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return { accessToken };
  }

  @Post('refresh-token')
  @HttpCode(200)
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @Headers('User-Agent') userAgent: string,
    @UserId() userId: string,
    @DeviceId() deviceId: string,
    @Ip() ip: string,
  ): Promise<{ accessToken: string }> {
    const deviceName = userAgent ?? 'unknown';

    const { accessToken, refreshToken } = await this.commandBus.execute(
      new RefreshTokenCommand({
        userId,
        ip,
        deviceName,
        deviceId,
      }),
    );

    res.cookie('refreshToken', refreshToken, {
      maxAge: this.auth.refreshTokenCookieMaxAgeMs,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(RefreshTokenGuard)
  async logout(
    @Res({ passthrough: true }) res: Response,
    @UserId() userId: string,
    @DeviceId() deviceId: string,
  ): Promise<void> {
    await this.commandBus.execute(new LogoutCommand(userId, deviceId));
    res.clearCookie('refreshToken');
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async getCurrentUser(@UserId() userId: string): Promise<CurrentUserViewModel> {
    return await this.queryBus.execute(new GetCurrentUserQuery(userId));
  }

  @Post('registration')
  @HttpCode(204)
  async registration(@Body() body: CreateUserInputDto): Promise<void> {
    const { login, email, password } = body;
    await this.commandBus.execute(new RegisterUserCommand({ login, email, password }));
  }

  @Post('registration-email-resending')
  @HttpCode(204)
  async registrationEmailResending(@Body() body: EmailInputDto): Promise<void> {
    await this.commandBus.execute(new RegistrationEmailResendingCommand(body.email));
  }

  @Post('registration-confirmation')
  @HttpCode(204)
  async registrationConfirmation(@Body('code') code: string): Promise<void> {
    await this.commandBus.execute(new RegistrationConfirmationCommand(code));
  }

  @Post('password-recovery')
  @HttpCode(204)
  async passwordRecovery(@Body() body: EmailInputDto): Promise<void> {
    await this.commandBus.execute(new PasswordRecoveryCommand(body.email));
  }

  @Post('new-password')
  @HttpCode(204)
  async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
    await this.commandBus.execute(new NewPasswordCommand(body.recoveryCode, body.newPassword));
  }
}
