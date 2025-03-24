import mongoose from 'mongoose';
import { Controller, Delete, Get, HttpCode } from '@nestjs/common';
import { AppService } from './app.service.js';
import { InjectConnection } from '@nestjs/mongoose';

@Controller()
export class AppController {
  constructor(
    @InjectConnection() private connection: mongoose.Connection,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Delete('testing/all-data')
  @HttpCode(204)
  async dropDb(): Promise<void> {
    await this.connection.dropDatabase();
  }
}
