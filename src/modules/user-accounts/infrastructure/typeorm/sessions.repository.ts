import { Inject, Injectable } from '@nestjs/common';
import { CreateSessionParams, DeviceViewType } from '../../types/sessions.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './sessions.entities.js';
import { Not, Repository } from 'typeorm';

@Injectable()
export class SessionsRepository {
  constructor(@InjectRepository(Device) private readonly sessionEntityRepo: Repository<Device>) {}

  async findDevice(deviceId: string): Promise<DeviceViewType | null> {
    const device = await this.sessionEntityRepo.findOneBy({ id: deviceId });
    if (!device) return null;
    return device.toViewType();
  }

  async getDeviceOwner(deviceId: string): Promise<string | null> {
    const device = await this.sessionEntityRepo.findOneBy({ id: deviceId });
    if (!device) return null;
    return device.userId.toString();
  }

  async createSession(params: CreateSessionParams): Promise<void> {
    const { userId, deviceId, deviceName, ip, iat, exp } = params;
    const device = this.sessionEntityRepo.create({
      id: deviceId,
      userId: parseInt(userId),
      name: deviceName,
      ip,
      iat,
      exp,
    });

    await this.sessionEntityRepo.save(device);
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.sessionEntityRepo.delete({ id: deviceId });
  }

  async deleteOtherDevices(deviceId: string): Promise<void> {
    const device = await this.sessionEntityRepo.findOne({
      select: { userId: true },
      where: { id: deviceId },
    });

    if (!device) return;
    const { userId } = device;

    await this.sessionEntityRepo.delete({ id: Not(deviceId), userId });
  }
}
