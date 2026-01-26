import { Inject, Injectable } from '@nestjs/common';
import { SessionsRepository } from '../infrastructure/sql/sessions.repository.js';
import { SessionsQueryRepository } from '../infrastructure/sql/sessions.query-repository.js';
import { validate as isUuid } from 'uuid';
import {
  AccessDeniedDomainException,
  DeviceNotFoundDomainException,
} from '../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(SessionsRepository) private sessionsRepository: SessionsRepository,
    @Inject(SessionsQueryRepository) private sessionsQueryRepository: SessionsQueryRepository,
  ) {}
  async createSession(
    userId: string,
    deviceId: string,
    deviceName: string,
    ip: string,
    iat: number,
    exp: number,
  ): Promise<void> {
    await this.sessionsRepository.deleteDevice(deviceId);
    await this.sessionsRepository.createSession(userId, deviceId, deviceName, ip, iat, exp);
  }

  async checkSession(userId: string, deviceId: string, iat: number): Promise<boolean> {
    return await this.sessionsQueryRepository.isSessionActive(userId, deviceId, iat);
  }

  async deleteDevice(userId: string, deviceId: string): Promise<void> {
    if (!isUuid(deviceId)) {
      throw new DeviceNotFoundDomainException();
    }

    const device = await this.sessionsRepository.findDevice(deviceId);
    if (!device) {
      throw new DeviceNotFoundDomainException();
    }

    const deviceOwner = await this.sessionsRepository.getDeviceOwner(deviceId);
    if (deviceOwner !== userId) {
      throw new AccessDeniedDomainException();
    }

    await this.sessionsRepository.deleteDevice(deviceId);
  }

  async deleteOtherDevices(deviceId: string): Promise<void> {
    await this.sessionsRepository.deleteOtherDevices(deviceId);
  }
}
