import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserParams, UserViewType } from '../../types/users.types.js';
import { UsersService } from '../users.service.js';

export class CreateUserCommand extends Command<UserViewType> {
  constructor(public readonly params: CreateUserParams) {
    super();
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly usersService: UsersService) {}

  async execute(command: CreateUserCommand): Promise<UserViewType> {
    return await this.usersService.createUser(command.params);
  }
}
