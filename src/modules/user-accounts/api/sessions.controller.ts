import { Controller, Delete, Get, HttpCode, Inject, Param, Req, UseGuards } from '@nestjs/common';
import { SessionsService } from '../application/sessions.service.js';
import { SessionsQueryRepository } from '../infrastructure/sql/sessions.query-repository.js';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard.js';
import { RequestWithSession } from '../../../common/types/requests.type.js';

@Controller('security/devices')
@UseGuards(RefreshTokenGuard)
export class SessionsController {
  constructor(
    @Inject(SessionsService) private sessionsService: SessionsService,
    @Inject(SessionsQueryRepository) private sessionsQueryRepository: SessionsQueryRepository,
  ) {}

  @Get()
  async getDevices(@Req() req: RequestWithSession) {
    const userId = req.userId;
    return await this.sessionsQueryRepository.getActiveDevices(userId);
  }

  @Delete()
  @HttpCode(204)
  async deleteOtherDevices(@Req() req: RequestWithSession) {
    const deviceId = req.deviceId;
    await this.sessionsService.deleteOtherDevices(deviceId);
  }

  @Delete(':deviceId')
  @HttpCode(204)
  async deleteDevice(@Req() req: RequestWithSession, @Param('deviceId') deviceId: string) {
    const userId = req.userId;
    await this.sessionsService.deleteDevice(userId, deviceId);
  }
}
