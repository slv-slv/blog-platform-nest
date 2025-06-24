import { Inject, Injectable } from '@nestjs/common';
import { DeviceViewType } from '../../types/sessions.types.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from '../typeorm/sessions.entities.js';
import { Not, Repository } from 'typeorm';

@Injectable()
export class SessionsRepository {
  constructor(
    @Inject(pool) private readonly pool: Pool,
    @InjectRepository(Device) private readonly sessionEntityRepo: Repository<Device>,
  ) {}

  // async findDevice(deviceId: string): Promise<DeviceViewType | null> {
  //   const result = await this.pool.query(
  //     `
  //       SELECT id, name, ip, iat
  //       FROM devices
  //       WHERE id = $1
  //     `,
  //     [deviceId],
  //   );

  //   if (result.rowCount === 0) {
  //     return null;
  //   }

  //   const device = result.rows[0];

  //   return {
  //     ip: device.ip,
  //     title: device.name,
  //     lastActiveDate: new Date(device.iat * 1000).toISOString(),
  //     deviceId: device.id,
  //   };
  // }

  async findDevice(deviceId: string): Promise<DeviceViewType | null> {
    const device = await this.sessionEntityRepo.findOneBy({ id: deviceId });
    if (!device) return null;
    return device.toViewType();
  }

  // async getDeviceOwner(deviceId: string): Promise<string | null> {
  //   const result = await this.pool.query(
  //     `
  //       SELECT user_id
  //       FROM devices
  //       WHERE id = $1
  //     `,
  //     [deviceId],
  //   );

  //   if (result.rowCount === 0) {
  //     return null;
  //   }

  //   const { user_id } = result.rows[0];
  //   return user_id.toString();
  // }

  async getDeviceOwner(deviceId: string): Promise<string | null> {
    const device = await this.sessionEntityRepo.findOneBy({ id: deviceId });
    if (!device) return null;
    return device.userId.toString();
  }

  // async createSession(
  //   userId: string,
  //   deviceId: string,
  //   deviceName: string,
  //   ip: string,
  //   iat: number,
  //   exp: number,
  // ): Promise<void> {
  //   await this.pool.query(
  //     `
  //       INSERT INTO devices
  //       VALUES ($1, $2, $3, $4, $5, $6)
  //     `,
  //     [deviceId, parseInt(userId), deviceName, ip, iat, exp],
  //   );
  // }

  async createSession(
    userId: string,
    deviceId: string,
    deviceName: string,
    ip: string,
    iat: number,
    exp: number,
  ): Promise<void> {
    const device = this.sessionEntityRepo.create({
      id: deviceId,
      userId: parseInt(userId),
      name: deviceName,
      ip,
      iat,
      exp,
    });

    await this.sessionEntityRepo.insert(device); // Возвращать сохраненную сущность не нужно, поэтому не save
  }

  // async deleteDevice(deviceId: string): Promise<void> {
  //   await this.pool.query(
  //     `
  //       DELETE FROM devices
  //       WHERE id = $1
  //     `,
  //     [deviceId],
  //   );
  // }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.sessionEntityRepo.delete({ id: deviceId });
  }

  // async deleteOtherDevices(deviceId: string): Promise<void> {
  //   await this.pool.query(
  //     `
  //       DELETE FROM devices
  //       WHERE user_id = (SELECT user_id FROM devices WHERE id = $1) AND id != $1
  //     `,
  //     [deviceId],
  //   );
  // }

  async deleteOtherDevices(deviceId: string): Promise<void> {
    const device = await this.sessionEntityRepo.findOne({
      select: { userId: true },
      where: { id: deviceId },
    });

    if (!device) return;
    const { userId } = device;

    await this.sessionEntityRepo.delete({ id: Not(deviceId), userId });
  }
}
