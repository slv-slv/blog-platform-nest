import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceType, Session } from './sessions-schemas.js';
import { Model } from 'mongoose';
import { DeviceViewType } from './sessions.types.js';

@Injectable()
export class SessionsQueryRepository {
  constructor(@InjectModel(Session.name) private readonly model: Model<Session>) {}

  async isSessionActive(userId: string, deviceId: string, iat: number): Promise<boolean> {
    const session = await this.model
      .findOne({ userId, devices: { $elemMatch: { id: deviceId, iat } } })
      .lean();
    return session !== null;
  }

  async getActiveDevices(userId: string): Promise<DeviceViewType[]> {
    const userSessions = await this.model.findOne({ userId }).lean();

    return userSessions!.devices.map((device: DeviceType) => ({
      ip: device.ip,
      title: device.name,
      lastActiveDate: new Date(device.iat * 1000).toISOString(),
      deviceId: device.id,
    }));
  }
}
