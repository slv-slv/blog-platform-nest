import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserParams, UserViewModel } from '../../types/users.types.js';
import { UsersService } from '../users.service.js';

export class CreateUserCommand extends Command<UserViewModel> {
  constructor(public readonly params: CreateUserParams) {
    super();
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly usersService: UsersService) {}

  async execute(command: CreateUserCommand) {
    return this.usersService.createUser(command.params);
  }
}
