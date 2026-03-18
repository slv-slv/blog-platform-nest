import { Response } from 'express';
import { Body, Controller, Get, Headers, HttpCode, Ip, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { UsersQueryRepository } from '../infrastructure/sql/users.query-repository.js';
import { UsersService } from '../application/users.service.js';
import { CreateUserInputDto, EmailInputDto, NewPasswordInputDto, UserType } from '../types/users.types.js';
import { AuthService } from '../application/auth.service.js';
import { SessionsService } from '../application/sessions.service.js';
import { CredentialsGuard } from '../../../common/guards/credentials.guard.js';
import { EmailConfirmationGuard } from '../../../common/guards/email-confirmation.guard.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard.js';
import { NoActiveSessionGuard } from '../../../common/guards/no-active-session.guard.js';
import { UnauthorizedDomainException } from '../../../common/exceptions/domain-exceptions.js';
import { User } from '../../../common/decorators/user.js';
import { UserId } from '../../../common/decorators/userId.js';
import { DeviceId } from '../../../common/decorators/deviceId.js';

@Controller('auth')
// @UseGuards(ThrottlerGuard)
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
    @User() user: UserType,
    @Ip() ip: string,
  ) {
    const userId = user.id;
    const deviceName = userAgent ?? 'unknown';

    const accessToken = await this.authService.generateAcessToken(userId);
    const refreshToken = await this.authService.generateRefreshToken(userId);

    const { deviceId, jti, iat, exp } = this.jwtService.decode(refreshToken);
    await this.sessionsService.createSession({ userId, deviceId, deviceName, ip, jti, iat, exp });

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
    @UserId() userId: string,
    @DeviceId() deviceId: string,
    @Ip() ip: string,
  ) {
    const deviceName = userAgent ?? 'unknown';

    const accessToken = await this.authService.generateAcessToken(userId);
    const refreshToken = await this.authService.generateRefreshToken(userId, deviceId);

    const { jti, iat, exp } = this.jwtService.decode(refreshToken);
    await this.sessionsService.createSession({ userId, deviceId, deviceName, ip, jti, iat, exp });

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
  async logout(
    @Res({ passthrough: true }) res: Response,
    @UserId() userId: string,
    @DeviceId() deviceId: string,
  ) {
    await this.sessionsService.deleteDevice(userId, deviceId);
    res.clearCookie('refreshToken');
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async me(@UserId() userId: string) {
    const user = await this.usersQueryRepository.getCurrentUser(userId);
    if (!user) {
      throw new UnauthorizedDomainException('User not found');
    }
    return user;
  }

  @Post('registration')
  @HttpCode(204)
  async registration(@Body() body: CreateUserInputDto) {
    const { login, email, password } = body;
    await this.usersService.registerUser({ login, email, password });
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
