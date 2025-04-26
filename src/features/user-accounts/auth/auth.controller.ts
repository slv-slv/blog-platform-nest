import { Response } from 'express';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersQueryRepository } from '../users/users.query-repository.js';
import { UsersService } from '../users/users.service.js';
import { CreateUserInputDto, EmailInputDto, NewPasswordInputDto } from '../users/users.types.js';
import { AuthService } from './auth.service.js';
import { CredentialsGuard } from '../../../common/guards/credentials.guard.js';
import { EmailConfirmationGuard } from '../../../common/guards/email-confirmation.guard.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { NoActiveSessionGuard } from '../../../common/guards/no-active-session.guard.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(NoActiveSessionGuard, CredentialsGuard, EmailConfirmationGuard)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Headers('User-Agent') userAgent: string,
    @Ip() ip: string,
  ) {
    const user = res.locals.user;
    const userId = user.id;
    const deviceName = userAgent ?? 'unknown';

    const accessToken = await this.authService.generateAcessToken(userId);
    const refreshToken = await this.authService.generateRefreshToken(userId);

    const { deviceId, iat, exp } = this.jwtService.decode(refreshToken);
    await this.sessionsService.createSession(userId, deviceId, deviceName, ip, iat, exp);

    const cookieExpiration = new Date();
    const years = cookieExpiration.getFullYear();
    cookieExpiration.setFullYear(years + 1);

    res.cookie('refreshToken', refreshToken, {
      expires: cookieExpiration,
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
    @Ip() ip: string,
  ) {
    const userId = res.locals.userId;
    const deviceId = res.locals.deviceId;
    const deviceName = userAgent ?? 'unknown';

    const accessToken = await this.authService.generateAcessToken(userId);
    const refreshToken = await this.authService.generateRefreshToken(userId, deviceId);

    const { iat, exp } = this.jwtService.decode(refreshToken);
    await this.sessionsService.createSession(userId, deviceId, deviceName, ip, iat, exp);

    const cookieExpiration = new Date();
    const years = cookieExpiration.getFullYear();
    cookieExpiration.setFullYear(years + 1);

    res.cookie('refreshToken', refreshToken, {
      expires: cookieExpiration,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(RefreshTokenGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    const userId = res.locals.userId;
    const deviceId = res.locals.deviceId;

    await this.sessionsService.deleteDevice(userId, deviceId);

    res.clearCookie('refreshToken');
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async me(@Res({ passthrough: true }) res: Response) {
    const userId = res.locals.userId;
    const user = await this.usersQueryRepository.getCurrentUser(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  @Post('registration')
  @HttpCode(204)
  async registration(@Body() body: CreateUserInputDto) {
    const { login, email, password } = body;
    await this.usersService.registerUser(login, email, password);
  }

  @Post('registration-email-resending')
  @HttpCode(204)
  async registrationEmailResending(@Body() body: EmailInputDto) {
    const { email } = body;
    await this.usersService.resendConfirmationCode(email);
  }

  @Post('registration-confirmation')
  @HttpCode(204)
  async registrationConfirmation(@Body('code') code: string) {
    await this.usersService.confirmUser(code);
  }

  @Post('password-recovery')
  @HttpCode(204)
  async passwordRecovery(@Body() body: EmailInputDto) {
    const { email } = body;
    await this.usersService.sendRecoveryCode(email);
  }

  @Post('new-password')
  @HttpCode(204)
  async newPassword(@Body() body: NewPasswordInputDto) {
    const { newPassword, recoveryCode } = body;
    await this.usersService.updatePassword(recoveryCode, newPassword);
  }
}
