import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/typeorm/sessions.repository.js';

export class DeleteOtherDevicesCommand extends Command<void> {
  constructor(public readonly deviceId: string) {
    super();
  }
}

@CommandHandler(DeleteOtherDevicesCommand)
export class DeleteOtherDevicesUseCase implements ICommandHandler<DeleteOtherDevicesCommand> {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute(command: DeleteOtherDevicesCommand) {
    await this.sessionsRepository.deleteOtherDevices(command.deviceId);
  }
}
