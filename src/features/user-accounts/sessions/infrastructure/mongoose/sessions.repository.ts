import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceType, Session } from './sessions.schemas.js';
import { Model } from 'mongoose';
import { DeviceViewType } from '../../sessions.types.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private readonly model: Model<Session>,
    @Inject(pool) private readonly pool: Pool,
  ) {}

  // async findDevice(deviceId: string): Promise<DeviceViewType | null> {
  //   const session = await this.model.findOne({ 'devices.id': deviceId }).lean();

  //   if (!session) {
  //     return null;
  //   }
  //   const device = session.devices.find((device: DeviceType) => device.id === deviceId)!;

  //   return {
  //     ip: device.ip,
  //     title: device.name,
  //     lastActiveDate: new Date(device.iat * 1000).toISOString(),
  //     deviceId: device.id,
  //   };
  // }

  async findDevice(deviceId: string): Promise<DeviceViewType | null> {
    const result = await this.pool.query(
      `
        SELECT id, name, ip, iat
        FROM devices
        WHERE id = $1
      `,
      [deviceId],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const device = result.rows[0];

    return {
      ip: device.ip,
      title: device.name,
      lastActiveDate: new Date(device.iat * 1000).toISOString(),
      deviceId: device.id,
    };
  }

  // async getDeviceOwner(deviceId: string): Promise<string | null> {
  //   const session = await this.model.findOne({ 'devices.id': deviceId }, { userId: 1 }).lean();

  //   if (!session) {
  //     return null;
  //   }

  //   return session.userId;
  // }

  async getDeviceOwner(deviceId: string): Promise<string | null> {
    const result = await this.pool.query(
      `
        SELECT user_id
        FROM devices
        WHERE id = $1
      `,
      [deviceId],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { user_id } = result.rows[0];
    return user_id.toString();
  }

  // async createSession(
  //   userId: string,
  //   deviceId: string,
  //   deviceName: string,
  //   ip: string,
  //   iat: number,
  //   exp: number,
  // ): Promise<void> {
  //   const newDevice: DeviceType = {
  //     id: deviceId,
  //     name: deviceName,
  //     ip,
  //     iat,
  //     exp,
  //   };

  //   const session = await this.model.findOne({ userId }).lean();
  //   if (!session) {
  //     await this.model.insertOne({ userId, devices: [newDevice] });
  //   } else {
  //     await this.model.updateOne({ userId }, { $push: { devices: newDevice } });
  //   }
  // }

  async createSession(
    userId: string,
    deviceId: string,
    deviceName: string,
    ip: string,
    iat: number,
    exp: number,
  ): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO devices
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [deviceId, parseInt(userId), deviceName, ip, iat, exp],
    );
  }

  // async deleteDevice(deviceId: string): Promise<void> {
  //   await this.model.updateOne({ 'devices.id': deviceId }, { $pull: { devices: { id: deviceId } } });
  // }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.pool.query(
      `
        DELETE FROM devices
        WHERE id = $1
      `,
      [deviceId],
    );
  }

  // async deleteOtherDevices(deviceId: string): Promise<void> {
  //   await this.model.updateOne({ 'devices.id': deviceId }, { $pull: { devices: { id: { $ne: deviceId } } } });
  // }

  async deleteOtherDevices(deviceId: string): Promise<void> {
    await this.pool.query(
      `
        DELETE FROM devices
        WHERE user_id = (SELECT user_id FROM devices WHERE id = $1) AND id != $1
      `,
      [deviceId],
    );
  }
}
