import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsService } from '../sessions.service.js';

export class DeleteDeviceCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {
    super();
  }
}

@CommandHandler(DeleteDeviceCommand)
export class DeleteDeviceUseCase implements ICommandHandler<DeleteDeviceCommand> {
  constructor(private readonly sessionsService: SessionsService) {}

  async execute(command: DeleteDeviceCommand) {
    await this.sessionsService.deleteDevice(command.userId, command.deviceId);
  }
}
