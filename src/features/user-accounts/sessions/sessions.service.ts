import { Inject, Injectable } from '@nestjs/common';
import { SessionsRepository } from './sessions.repository.js';
import { SessionsQueryRepository } from './sessions.query-repository.js';

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

  async deleteDevice(deviceId: string): Promise<void> {
    await this.sessionsRepository.deleteDevice(deviceId);
  }

  async deleteOtherDevices(deviceId: string): Promise<void> {
    await this.sessionsRepository.deleteOtherDevices(deviceId);
  }
}
