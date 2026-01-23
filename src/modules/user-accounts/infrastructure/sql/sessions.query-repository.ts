import { Inject, Injectable } from '@nestjs/common';
import { DeviceViewType } from '../../types/sessions.types.js';
import { pool } from '../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class SessionsQueryRepository {
  constructor(@Inject(pool) private readonly pool: Pool) {}

  async isSessionActive(userId: string, deviceId: string, iat: number): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT *
        FROM devices
        WHERE id = $1 AND user_id = $2 AND iat = $3
      `,
      [deviceId, parseInt(userId), iat],
    );

    return result.rowCount! > 0;
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
