import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceModel, Session } from './sessions.schemas.js';
import { DeviceViewModel } from '../../types/sessions.types.js';

@Injectable()
export class SessionsQueryRepository {
  constructor(@InjectModel(Session.name) private readonly model: Model<Session>) {}

  async getActiveDevices(userId: string): Promise<DeviceViewModel[]> {
    const userSessions = await this.model.findOne({ userId }).lean();

    return userSessions!.devices.map((device: DeviceModel) => ({
      ip: device.ip,
      title: device.name,
      lastActiveDate: new Date(device.iat * 1000).toISOString(),
      deviceId: device.id,
    }));
  }
}
