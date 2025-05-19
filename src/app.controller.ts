import mongoose from 'mongoose';
import { Controller, Delete, Get, HttpCode, Inject } from '@nestjs/common';
import { AppService } from './app.service.js';
import { InjectConnection } from '@nestjs/mongoose';
import { pool } from './common/constants.js';
import { Pool } from 'pg';

@Controller()
export class AppController {
  constructor(
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly appService: AppService,
    @Inject(pool) private readonly pool: Pool,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Delete('testing/all-data')
  // @HttpCode(204)
  // async dropDb(): Promise<void> {
  //   await this.connection.dropDatabase();
  // }

  @Delete('testing/all-data')
  @HttpCode(204)
  async dropDb(): Promise<void> {
    await this.pool.query(`
      TRUNCATE blogs, posts, users, confirmation, recovery, devices RESTART IDENTITY CASCADE
    `);
  }
}
