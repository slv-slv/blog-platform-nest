import { Inject, Injectable } from '@nestjs/common';
import { DeviceViewType } from '../../types/sessions.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class SessionsQueryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async isSessionActive(jti: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT *
        FROM devices
        WHERE jti = $1
      `,
      [jti],
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
