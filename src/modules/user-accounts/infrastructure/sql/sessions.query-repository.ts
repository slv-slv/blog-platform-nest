import { Inject, Injectable } from '@nestjs/common';
import { DeviceViewModel } from '../../types/sessions.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class SessionsQueryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async getActiveDevices(userId: string): Promise<DeviceViewModel[]> {
    if (!isPositiveIntegerString(userId)) {
      return [];
    }

    const result = await this.pool.query(
      `
        SELECT id, name, ip, iat
        FROM devices
        WHERE user_id = $1::int
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
