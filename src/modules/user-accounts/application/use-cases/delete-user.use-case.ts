import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/typeorm/users.repository.js';

export class DeleteUserCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: DeleteUserCommand) {
    await this.usersRepository.deleteUser(command.id);
  }
}
