import { Response } from 'express';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { UsersService } from '../application/users.service.js';
import { UsersQueryRepository } from '../infrastructure/sql/users.query-repository.js';
import {
  CreateUserInputDto,
  GetUsersQueryParams,
  UsersPaginatedType,
  UserViewType,
} from '../types/users.types.js';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard.js';

@Controller('sa/users')
@UseGuards(BasicAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  async getAllUsers(
    @Query() query: GetUsersQueryParams,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UsersPaginatedType> {
    const { searchLoginTerm, searchEmailTerm, sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };

    const users = await this.usersQueryRepository.getAllUsers(searchLoginTerm, searchEmailTerm, pagingParams);
    return users;
  }

  @Post()
  @HttpCode(201)
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewType> {
    const { login, password, email } = body;
    const newUser = await this.usersService.createUser(login, email, password);
    return newUser;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteUser(id);
  }
}
