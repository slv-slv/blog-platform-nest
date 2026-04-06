import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsService } from '../sessions.service.js';

export class LogoutCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {
    super();
  }
}

@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
  constructor(private readonly sessionsService: SessionsService) {}

  async execute(command: LogoutCommand) {
    await this.sessionsService.deleteDevice(command.userId, command.deviceId);
  }
}
