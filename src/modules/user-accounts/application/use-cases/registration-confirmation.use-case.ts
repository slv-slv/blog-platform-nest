import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/typeorm/users.repository.js';
import {
  ConfirmationCodeExpiredDomainException,
  EmailAlreadyConfirmedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';

export class RegistrationConfirmationCommand extends Command<void> {
  constructor(public readonly code: string) {
    super();
  }
}

@CommandHandler(RegistrationConfirmationCommand)
export class RegistrationConfirmationUseCase implements ICommandHandler<RegistrationConfirmationCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: RegistrationConfirmationCommand) {
    const confirmationInfo = await this.usersRepository.getConfirmationInfo(command.code);

    if (confirmationInfo.isConfirmed) {
      throw new EmailAlreadyConfirmedDomainException();
    }

    const expirationDate = new Date(confirmationInfo.expiration!);
    const currentDate = new Date();

    if (expirationDate < currentDate) {
      throw new ConfirmationCodeExpiredDomainException();
    }

    await this.usersRepository.confirmUser(command.code);
  }
}
