import { Controller, Delete, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import mongoose from 'mongoose';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Delete('testing/all-data')
  async dropDb(): Promise<void> {
    await mongoose.connection.dropDatabase();
  }
}
