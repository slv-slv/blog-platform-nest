import { Injectable } from '@nestjs/common';
import { CreateSessionParams, DeviceViewModel } from '../../types/sessions.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './sessions.entities.js';
import { Not, Repository } from 'typeorm';
import {
  DeviceNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class SessionsRepository {
  constructor(@InjectRepository(Device) private readonly sessionEntityRepository: Repository<Device>) {}

  async isSessionActive(jti: string, deviceId: string): Promise<boolean> {
    const device = await this.sessionEntityRepository.findOneBy({ jti, id: deviceId });
    return !!device;
  }

  async findDevice(deviceId: string): Promise<DeviceViewModel> {
    const device = await this.sessionEntityRepository.findOneBy({ id: deviceId });
    if (!device) {
      throw new DeviceNotFoundDomainException();
    }

    return device.toViewModel();
  }

  async getDeviceOwner(deviceId: string): Promise<string> {
    const device = await this.sessionEntityRepository.findOneBy({ id: deviceId });
    if (!device) {
      throw new DeviceNotFoundDomainException();
    }

    return device.userId.toString();
  }

  async createSession(params: CreateSessionParams): Promise<void> {
    const { userId, deviceId, deviceName, ip, jti, iat, exp } = params;

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    await this.sessionEntityRepository.insert({
      id: deviceId,
      userId: +userId,
      name: deviceName,
      ip,
      jti,
      iat,
      exp,
    });
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
