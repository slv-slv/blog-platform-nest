import { Inject, Injectable } from '@nestjs/common';
import { CheckSessionParams, DeviceViewType } from '../../types/sessions.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './sessions.entities.js';
import { Repository } from 'typeorm';

@Injectable()
export class SessionsQueryRepository {
  constructor(@InjectRepository(Device) private readonly sessionEntityRepo: Repository<Device>) {}

  async isSessionActive(params: CheckSessionParams): Promise<boolean> {
    const { userId, deviceId, iat } = params;
    return await this.sessionEntityRepo.existsBy({ id: deviceId, userId: parseInt(userId), iat });
  }

  async getActiveDevices(userId: string): Promise<DeviceViewType[]> {
    const devices = await this.sessionEntityRepo.findBy({ userId: parseInt(userId) });

    return devices.map((device) => device.toViewType());
  }
}
