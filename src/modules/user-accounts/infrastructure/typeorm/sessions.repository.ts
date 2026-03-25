import { Inject, Injectable } from '@nestjs/common';
import { CreateSessionParams, DeviceViewType } from '../../types/sessions.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './sessions.entities.js';
import { Not, Repository } from 'typeorm';
import { DeviceNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class SessionsRepository {
  constructor(@InjectRepository(Device) private readonly sessionEntityRepository: Repository<Device>) {}

  async findDevice(deviceId: string): Promise<DeviceViewType> {
    const device = await this.sessionEntityRepository.findOneBy({ id: deviceId });
    if (!device) {
      throw new DeviceNotFoundDomainException();
    }

    return device.toViewType();
  }

  async getDeviceOwner(deviceId: string): Promise<string> {
    const device = await this.sessionEntityRepository.findOneBy({ id: deviceId });
    if (!device) {
      throw new DeviceNotFoundDomainException();
    }

    return device.userId.toString();
  }

  async createSession(params: CreateSessionParams): Promise<void> {
    const { userId, deviceId, deviceName, ip, iat, exp } = params;
    const device = this.sessionEntityRepository.create({
      id: deviceId,
      userId: parseInt(userId),
      name: deviceName,
      ip,
      iat,
      exp,
    });

    await this.sessionEntityRepository.save(device);
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.sessionEntityRepository.delete({ id: deviceId });
  }

  async deleteOtherDevices(deviceId: string): Promise<void> {
    const device = await this.sessionEntityRepository.findOne({
      select: { userId: true },
      where: { id: deviceId },
    });

    if (!device) return;
    const { userId } = device;

    await this.sessionEntityRepository.delete({ id: Not(deviceId), userId });
  }
}
