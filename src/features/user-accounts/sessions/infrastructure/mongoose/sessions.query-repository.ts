import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceType, Session } from './sessions.schemas.js';
import { DeviceViewType } from '../../sessions.types.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @InjectModel(Session.name) private readonly model: Model<Session>,
    @Inject(pool) private readonly pool: Pool,
  ) {}

  // async isSessionActive(userId: string, deviceId: string, iat: number): Promise<boolean> {
  //   const session = await this.model
  //     .findOne({ userId, devices: { $elemMatch: { id: deviceId, iat } } })
  //     .lean();
  //   return session !== null;
  // }

  async isSessionActive(userId: string, deviceId: string, iat: number): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT *
        FROM devices
        WHERE id = $1 AND user_id = $2 AND iat = $3
      `,
      [deviceId, userId, iat],
    );

    return result.rowCount! > 0;
  }

  // async getActiveDevices(userId: string): Promise<DeviceViewType[]> {
  //   const userSessions = await this.model.findOne({ userId }).lean();

  //   return userSessions!.devices.map((device: DeviceType) => ({
  //     ip: device.ip,
  //     title: device.name,
  //     lastActiveDate: new Date(device.iat * 1000).toISOString(),
  //     deviceId: device.id,
  //   }));
  // }

  async getActiveDevices(userId: string): Promise<DeviceViewType[]> {
    const result = await this.pool.query(
      `
        SELECT id, name, ip, iat
        FROM devices
        WHERE user_id = $1
      `,
      [userId],
    );

    return result.rows.map((device) => ({
      ip: device.ip,
      title: device.name,
      lastActiveDate: new Date(device.iat * 1000).toISOString(),
      deviceId: device.id,
    }));
  }
}
