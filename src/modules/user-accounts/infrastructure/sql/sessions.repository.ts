import { Inject, Injectable } from '@nestjs/common';
import { CreateSessionParams, DeviceViewType } from '../../types/sessions.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import {
  DeviceNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class SessionsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async isSessionActive(jti: string, deviceId: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT *
        FROM devices
        WHERE jti = $1 AND id = $2
      `,
      [jti, deviceId],
    );

    return result.rowCount! > 0;
  }

  async findDevice(deviceId: string): Promise<DeviceViewType> {
    const result = await this.pool.query(
      `
        SELECT id, name, ip, iat
        FROM devices
        WHERE id = $1
      `,
      [deviceId],
    );

    if (result.rowCount === 0) {
      throw new DeviceNotFoundDomainException();
    }

    const device = result.rows[0];

    return {
      ip: device.ip,
      title: device.name,
      lastActiveDate: new Date(device.iat * 1000).toISOString(),
      deviceId: device.id,
    };
  }

  async getDeviceOwner(deviceId: string): Promise<string> {
    const result = await this.pool.query(
      `
        SELECT user_id
        FROM devices
        WHERE id = $1
      `,
      [deviceId],
    );

    if (result.rowCount === 0) {
      throw new DeviceNotFoundDomainException();
    }

    const { user_id } = result.rows[0];
    return user_id.toString();
  }
  async createSession(params: CreateSessionParams): Promise<void> {
    const { userId, deviceId, deviceName, ip, jti, iat, exp } = params;

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    await this.pool.query(
      `
        INSERT INTO devices
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [deviceId, userId, deviceName, ip, jti, iat, exp],
    );
  }
  async deleteDevice(deviceId: string): Promise<void> {
    await this.pool.query(
      `
        DELETE FROM devices
        WHERE id = $1
      `,
      [deviceId],
    );
  }
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
