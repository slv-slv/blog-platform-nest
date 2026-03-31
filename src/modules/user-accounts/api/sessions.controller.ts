import { Controller, Delete, Get, HttpCode, Inject, Param, UseGuards } from '@nestjs/common';
import { SessionsService } from '../application/sessions.service.js';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard.js';
import { UserId } from '../../../common/decorators/userId.js';
import { DeviceId } from '../../../common/decorators/deviceId.js';
import { DeviceViewModel } from '../types/sessions.types.js';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetDevicesQuery } from '../application/use-cases/get-devices.use-case.js';
import { DeleteOtherDevicesCommand } from '../application/use-cases/delete-other-devices.use-case.js';

@Controller('security/devices')
@UseGuards(RefreshTokenGuard)
export class SessionsController {
  constructor(
    @Inject(SessionsService) private readonly sessionsService: SessionsService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getDevices(@UserId() userId: string): Promise<DeviceViewModel[]> {
    return this.queryBus.execute(new GetDevicesQuery(userId));
  }

  @Delete()
  @HttpCode(204)
  async deleteOtherDevices(@DeviceId() deviceId: string): Promise<void> {
    await this.commandBus.execute(new DeleteOtherDevicesCommand(deviceId));
  }

  @Delete(':deviceId')
  @HttpCode(204)
  async deleteDevice(@Param('deviceId') deviceId: string, @UserId() userId: string): Promise<void> {
    await this.sessionsService.deleteDevice(userId, deviceId);
  }
}
