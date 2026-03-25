import { Inject, Injectable } from '@nestjs/common';
import { SessionsRepository } from '../infrastructure/sql/sessions.repository.js';
import { validate as isUuid } from 'uuid';
import {
  AccessDeniedDomainException,
  DeviceNotFoundDomainException,
} from '../../../common/exceptions/domain-exceptions.js';
import { CreateSessionParams } from '../types/sessions.types.js';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(SessionsRepository) private sessionsRepository: SessionsRepository,
  ) {}
  async createSession(params: CreateSessionParams): Promise<void> {
    const { deviceId } = params;
    await this.sessionsRepository.deleteDevice(deviceId);
    await this.sessionsRepository.createSession(params);
  }

  async checkSession(jti: string, deviceId: string): Promise<boolean> {
    return await this.sessionsRepository.isSessionActive(jti, deviceId);
  }

  async deleteDevice(userId: string, deviceId: string): Promise<void> {
    if (!isUuid(deviceId)) {
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
