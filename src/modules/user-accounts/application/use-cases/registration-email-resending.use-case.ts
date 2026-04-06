import { Inject } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfigType } from '@nestjs/config';
import { UsersRepository } from '../../infrastructure/typeorm/users.repository.js';
import { EmailService } from '../../../../notifications/email/email.service.js';
import { authConfig } from '../../../../config/auth.config.js';
import {
  EmailAlreadyConfirmedDomainException,
  IncorrectEmailDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';

export class RegistrationEmailResendingCommand extends Command<void> {
  constructor(public readonly email: string) {
    super();
  }
}

@CommandHandler(RegistrationEmailResendingCommand)
export class RegistrationEmailResendingUseCase implements ICommandHandler<RegistrationEmailResendingCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    @Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>,
  ) {}

  async execute(command: RegistrationEmailResendingCommand) {
    const user = await this.usersRepository.findUser(command.email);
    if (!user) {
      throw new IncorrectEmailDomainException();
    }

    if (user.confirmation.isConfirmed) {
      throw new EmailAlreadyConfirmedDomainException();
    }

    const code = crypto.randomUUID();

    const expiration = new Date();
    const hours = expiration.getHours();
    expiration.setHours(hours + this.auth.confirmationCodeExpiresIn);

    await this.emailService.sendConfirmationCode(command.email, code);
    await this.usersRepository.updateConfirmationCode({ email: command.email, code, expiration });
  }
}
