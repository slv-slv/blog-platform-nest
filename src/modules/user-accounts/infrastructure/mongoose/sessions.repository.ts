import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceType, Session } from './sessions.schemas.js';
import { Model } from 'mongoose';
import { CreateSessionParams, DeviceViewType } from '../../types/sessions.types.js';
import { DeviceNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class SessionsRepository {
  constructor(@InjectModel(Session.name) private readonly model: Model<Session>) {}

  async isSessionActive(jti: string, deviceId: string): Promise<boolean> {
    const session = await this.model.findOne({
      devices: { $elemMatch: { id: deviceId, jti } },
    });

    return !!session;
  }

  async findDevice(deviceId: string): Promise<DeviceViewType> {
    const session = await this.model.findOne({ 'devices.id': deviceId }).lean();

    if (!session) {
      throw new DeviceNotFoundDomainException();
    }
    const device = session.devices.find((device: DeviceType) => device.id === deviceId)!;

    return {
      ip: device.ip,
      title: device.name,
      lastActiveDate: new Date(device.iat * 1000).toISOString(),
      deviceId: device.id,
    };
  }

  async getDeviceOwner(deviceId: string): Promise<string> {
    const session = await this.model.findOne({ 'devices.id': deviceId }, { userId: 1 }).lean();

    if (!session) {
      throw new DeviceNotFoundDomainException();
    }

    return session.userId;
  }

  async createSession(params: CreateSessionParams): Promise<void> {
    const { userId, deviceId, deviceName, ip, jti, iat, exp } = params;
    const newDevice: DeviceType = {
      id: deviceId,
      name: deviceName,
      ip,
      jti,
      iat,
      exp,
    };

    const session = await this.model.findOne({ userId }).lean();
    if (!session) {
      await this.model.create({ userId, devices: [newDevice] });
    } else {
      await this.model.updateOne({ userId }, { $push: { devices: newDevice } }, { runValidators: true });
    }
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.model.updateOne(
      { 'devices.id': deviceId },
      { $pull: { devices: { id: deviceId } } },
      { runValidators: true },
    );
  }

  async deleteOtherDevices(deviceId: string): Promise<void> {
    await this.model.updateOne(
      { 'devices.id': deviceId },
      { $pull: { devices: { id: { $ne: deviceId } } } },
      { runValidators: true },
    );
  }
}
