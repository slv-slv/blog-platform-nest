import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsService } from '../sessions.service.js';

export class DeleteOtherDevicesCommand extends Command<void> {
  constructor(public readonly deviceId: string) {
    super();
  }
}

@CommandHandler(DeleteOtherDevicesCommand)
export class DeleteOtherDevicesUseCase implements ICommandHandler<DeleteOtherDevicesCommand> {
  constructor(private readonly sessionsService: SessionsService) {}

  async execute(command: DeleteOtherDevicesCommand) {
    await this.sessionsService.deleteOtherDevices(command.deviceId);
  }
}
