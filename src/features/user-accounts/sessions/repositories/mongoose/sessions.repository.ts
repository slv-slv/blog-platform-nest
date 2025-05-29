import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceType, Session } from './sessions.schemas.js';
import { Model } from 'mongoose';
import { DeviceViewType } from '../../types/sessions.types.js';

@Injectable()
export class SessionsRepository {
  constructor(@InjectModel(Session.name) private readonly model: Model<Session>) {}

  async findDevice(deviceId: string): Promise<DeviceViewType | null> {
    const session = await this.model.findOne({ 'devices.id': deviceId }).lean();

    if (!session) {
      return null;
    }
    const device = session.devices.find((device: DeviceType) => device.id === deviceId)!;

    return {
      ip: device.ip,
      title: device.name,
      lastActiveDate: new Date(device.iat * 1000).toISOString(),
      deviceId: device.id,
    };
  }

  async getDeviceOwner(deviceId: string): Promise<string | null> {
    const session = await this.model.findOne({ 'devices.id': deviceId }, { userId: 1 }).lean();

    if (!session) {
      return null;
    }

    return session.userId;
  }

  async createSession(
    userId: string,
    deviceId: string,
    deviceName: string,
    ip: string,
    iat: number,
    exp: number,
  ): Promise<void> {
    const newDevice: DeviceType = {
      id: deviceId,
      name: deviceName,
      ip,
      iat,
      exp,
    };

    const session = await this.model.findOne({ userId }).lean();
    if (!session) {
      await this.model.insertOne({ userId, devices: [newDevice] });
    } else {
      await this.model.updateOne({ userId }, { $push: { devices: newDevice } });
    }
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.model.updateOne({ 'devices.id': deviceId }, { $pull: { devices: { id: deviceId } } });
  }

  async deleteOtherDevices(deviceId: string): Promise<void> {
    await this.model.updateOne({ 'devices.id': deviceId }, { $pull: { devices: { id: { $ne: deviceId } } } });
  }
}
