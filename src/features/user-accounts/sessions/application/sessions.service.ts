import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SessionsRepository } from '../infrastructure/mongoose/sessions.repository.js';
import { SessionsQueryRepository } from '../infrastructure/mongoose/sessions.query-repository.js';

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
    const device = await this.sessionsRepository.findDevice(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const deviceOwner = await this.sessionsRepository.getDeviceOwner(deviceId);
    if (deviceOwner !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.sessionsRepository.deleteDevice(deviceId);
  }

  async deleteOtherDevices(deviceId: string): Promise<void> {
    await this.sessionsRepository.deleteOtherDevices(deviceId);
  }
}
