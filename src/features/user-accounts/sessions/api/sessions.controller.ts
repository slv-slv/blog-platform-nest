import { Controller, Delete, Get, HttpCode, Inject, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SessionsService } from '../application/sessions.service.js';
import { SessionsQueryRepository } from '../repositories/postgresql/sessions.query-repository.js';
import { RefreshTokenGuard } from '../../../../common/guards/refresh-token.guard.js';

@Controller('security/devices')
export class SessionsController {
  constructor(
    @Inject(SessionsService) private sessionsService: SessionsService,
    @Inject(SessionsQueryRepository) private sessionsQueryRepository: SessionsQueryRepository,
  ) {}

  @Get()
  @UseGuards(RefreshTokenGuard)
  async getDevices(@Res({ passthrough: true }) res: Response) {
    const userId = res.locals.userId;
    return await this.sessionsQueryRepository.getActiveDevices(userId);
  }

  @Delete()
  @HttpCode(204)
  @UseGuards(RefreshTokenGuard)
  async deleteOtherDevices(@Res({ passthrough: true }) res: Response) {
    const deviceId = res.locals.deviceId;
    await this.sessionsService.deleteOtherDevices(deviceId);
  }

  @Delete(':deviceId')
  @HttpCode(204)
  @UseGuards(RefreshTokenGuard)
  async deleteDevice(@Res({ passthrough: true }) res: Response, @Param('deviceId') deviceId: string) {
    const userId = res.locals.userId;
    await this.sessionsService.deleteDevice(userId, deviceId);
  }
}
