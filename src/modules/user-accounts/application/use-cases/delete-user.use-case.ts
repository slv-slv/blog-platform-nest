import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '../users.service.js';

export class DeleteUserCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly usersService: UsersService) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    await this.usersService.deleteUser(command.id);
  }
}
