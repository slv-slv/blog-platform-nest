import { Controller, Delete, Get, HttpCode, Inject, Param, UseGuards } from '@nestjs/common';
import { SessionsService } from '../application/sessions.service.js';
import { SessionsQueryRepository } from '../infrastructure/sql/sessions.query-repository.js';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard.js';
import { UserId } from '../../../common/decorators/userId.js';
import { DeviceId } from '../../../common/decorators/deviceId.js';
import { DeviceViewType } from '../types/sessions.types.js';

@Controller('security/devices')
@UseGuards(RefreshTokenGuard)
export class SessionsController {
  constructor(
    @Inject(SessionsService) private sessionsService: SessionsService,
    @Inject(SessionsQueryRepository) private sessionsQueryRepository: SessionsQueryRepository,
  ) {}

  @Get()
  async getDevices(@UserId() userId: string): Promise<DeviceViewType[]> {
    return await this.sessionsQueryRepository.getActiveDevices(userId);
  }

  @Delete()
  @HttpCode(204)
  async deleteOtherDevices(@DeviceId() deviceId: string): Promise<void> {
    await this.sessionsService.deleteOtherDevices(deviceId);
  }

  @Delete(':deviceId')
  @HttpCode(204)
  async deleteDevice(@Param('deviceId') deviceId: string, @UserId() userId: string): Promise<void> {
    await this.sessionsService.deleteDevice(userId, deviceId);
  }
}
