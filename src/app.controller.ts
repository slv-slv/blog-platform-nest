import mongoose from 'mongoose';
import { Controller, Delete, Get, HttpCode, Inject } from '@nestjs/common';
import { AppService } from './app.service.js';
import { InjectConnection } from '@nestjs/mongoose';
import { PG_POOL } from './common/constants.js';
import { Pool } from 'pg';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

@Controller()
export class AppController {
  constructor(
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly appService: AppService,
    @Inject(PG_POOL) private readonly pool: Pool,
    @InjectEntityManager() private readonly entityManager: EntityManager,
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
      TRUNCATE
        blogs,
        posts,
        comments,
        users,
        devices,
        comment_likes,
        comment_dislikes,
        post_likes,
        post_dislikes
      RESTART IDENTITY CASCADE
    `);
    await this.entityManager.query(`
      TRUNCATE
        typeorm.blogs,
        typeorm.posts,
        typeorm.comments,
        typeorm.users,
        typeorm.devices,
        typeorm.comment_likes,
        typeorm.comment_dislikes,
        typeorm.post_likes,
        typeorm.post_dislikes
      RESTART IDENTITY CASCADE
    `);
  }
}
