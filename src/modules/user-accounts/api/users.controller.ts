import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '../application/users.service.js';
import {
  CreateUserInputDto,
  GetUsersQueryParams,
  UsersPaginatedType,
  UserViewType,
} from '../types/users.types.js';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard.js';
import { QueryBus } from '@nestjs/cqrs';
import { GetUsersQuery } from '../application/use-cases/get-users.use-case.js';

@Controller('sa/users')
@UseGuards(BasicAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getUsers(@Query() query: GetUsersQueryParams): Promise<UsersPaginatedType> {
    const { searchLoginTerm, searchEmailTerm, sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };
    return await this.queryBus.execute(
      new GetUsersQuery({
        searchLoginTerm,
        searchEmailTerm,
        pagingParams,
      }),
    );
  }

  @Post()
  @HttpCode(201)
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewType> {
    const { login, password, email } = body;
    const newUser = await this.usersService.createUser({ login, email, password });
    return newUser;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteUser(id);
  }
}
