import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  CreateUserInputDto,
  GetUsersQueryDto,
  UsersPaginatedViewModel,
  UserViewModel,
} from '../types/users.types.js';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard.js';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetUsersQuery } from '../application/use-cases/get-users.use-case.js';
import { CreateUserCommand } from '../application/use-cases/create-user.use-case.js';
import { DeleteUserCommand } from '../application/use-cases/delete-user.use-case.js';

@Controller('sa/users')
@UseGuards(BasicAuthGuard)
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getUsers(@Query() query: GetUsersQueryDto): Promise<UsersPaginatedViewModel> {
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
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewModel> {
    const { login, password, email } = body;
    return await this.commandBus.execute(new CreateUserCommand({ login, email, password }));
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteUserCommand(id));
  }
}
