import { Request, Response } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersQueryRepository } from '../users/users.query-repository.js';
import { UsersService } from '../users/users.service.js';
import { CreateUserInputDto, EmailInputDto, NewPasswordInputDto } from '../users/users.types.js';
import { CheckCredentials } from './guards/check-credentials.guard.js';
import { CheckConfirmation } from './guards/check-confirmation.guard.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @UseGuards(CheckCredentials, CheckConfirmation)
  async sendJwtPair(@Res({ passthrough: true }) res: Response) {
    const user = res.locals.user;
    const userId = user.id;
    const accessToken = this.authService.generateAcessToken(userId);

    // const refreshToken = res.locals.refreshToken;
    // console.log('Сервер отправил токен: ' + JSON.stringify(authService.verifyJwt(refreshToken)));

    // const cookieExpiration = new Date();
    // const years = cookieExpiration.getFullYear();
    // cookieExpiration.setFullYear(years + 1);

    // res.cookie('refreshToken', refreshToken, {
    //   expires: cookieExpiration,
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'strict',
    // });

    return accessToken;
  }

  // async logout(req: Request, res: Response) {
  //   // const userId = res.locals.userId;
  //   const deviceId = res.locals.deviceId;

  //   await this.sessionsService.deleteDevice(deviceId);

  //   res.clearCookie('refreshToken').status(HTTP_STATUS.NO_CONTENT_204).end();
  // }

  @Get('me')
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
