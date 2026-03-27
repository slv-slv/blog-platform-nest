import { Inject, Injectable } from '@nestjs/common';
import { DeviceViewModel } from '../../types/sessions.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './sessions.entities.js';
import { Repository } from 'typeorm';

@Injectable()
export class SessionsQueryRepository {
  constructor(@InjectRepository(Device) private readonly sessionEntityRepository: Repository<Device>) {}

  async getActiveDevices(userId: string): Promise<DeviceViewModel[]> {
    const devices = await this.sessionEntityRepository.findBy({ userId: parseInt(userId) });

    return devices.map((device) => device.toViewModel());
  }
}
