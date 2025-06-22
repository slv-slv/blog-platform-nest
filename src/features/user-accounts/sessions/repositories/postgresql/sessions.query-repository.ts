import { Inject, Injectable } from '@nestjs/common';
import { DeviceViewType } from '../../types/sessions.types.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from '../typeorm/sessions.entities.js';
import { Repository } from 'typeorm';

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @Inject(pool) private readonly pool: Pool,
    @InjectRepository(Device) private readonly sessionEntityRepo: Repository<Device>,
  ) {}

  // async isSessionActive(userId: string, deviceId: string, iat: number): Promise<boolean> {
  //   const result = await this.pool.query(
  //     `
  //       SELECT *
  //       FROM devices
  //       WHERE id = $1 AND user_id = $2 AND iat = $3
  //     `,
  //     [deviceId, parseInt(userId), iat],
  //   );

  //   return result.rowCount! > 0;
  // }

  async isSessionActive(userId: string, deviceId: string, iat: number): Promise<boolean> {
    return await this.sessionEntityRepo.existsBy({ id: deviceId, userId: parseInt(userId), iat });
  }

  async getActiveDevices(userId: string): Promise<DeviceViewType[]> {
    const result = await this.pool.query(
      `
        SELECT id, name, ip, iat
        FROM devices
        WHERE user_id = $1
      `,
      [parseInt(userId)],
    );

    return result.rows.map((device) => ({
      ip: device.ip,
      title: device.name,
      lastActiveDate: new Date(device.iat * 1000).toISOString(),
      deviceId: device.id,
    }));
  }
}
