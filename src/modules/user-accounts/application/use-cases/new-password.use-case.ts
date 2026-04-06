import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/typeorm/users.repository.js';
import { AuthService } from '../auth.service.js';
import { RecoveryCodeExpiredDomainException } from '../../../../common/exceptions/domain-exceptions.js';

export class NewPasswordCommand extends Command<void> {
  constructor(
    public readonly recoveryCode: string,
    public readonly newPassword: string,
  ) {
    super();
  }
}

@CommandHandler(NewPasswordCommand)
export class NewPasswordUseCase implements ICommandHandler<NewPasswordCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(command: NewPasswordCommand) {
    const passwordRecoveryInfo = await this.usersRepository.getPasswordRecoveryInfo(command.recoveryCode);

    const expirationDate = passwordRecoveryInfo.expiration!;
    const currentDate = new Date();

    if (expirationDate < currentDate) {
      throw new RecoveryCodeExpiredDomainException();
    }

    const hash = await this.authService.hashPassword(command.newPassword);
    await this.usersRepository.updatePassword(command.recoveryCode, hash);
  }
}
