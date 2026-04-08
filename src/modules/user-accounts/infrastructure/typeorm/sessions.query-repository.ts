import { Injectable } from '@nestjs/common';
import { DeviceViewModel } from '../../types/sessions.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './entities/device.entity.js';
import { Repository } from 'typeorm';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class SessionsQueryRepository {
  constructor(@InjectRepository(Device) private readonly sessionEntityRepository: Repository<Device>) {}

  async getActiveDevices(userId: string): Promise<DeviceViewModel[]> {
    if (!isPositiveIntegerString(userId)) {
      return [];
    }

    const devices = await this.sessionEntityRepository.findBy({ userId: +userId });

    return devices.map((device) => device.toViewModel());
  }
}
