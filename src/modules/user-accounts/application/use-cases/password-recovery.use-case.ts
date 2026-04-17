import { Inject } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfigType } from '@nestjs/config';
import { UsersRepository } from '../../infrastructure/typeorm/users.repository.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { authConfig } from '../../../../config/auth.config.js';

export class PasswordRecoveryCommand extends Command<void> {
  constructor(public readonly email: string) {
    super();
  }
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase implements ICommandHandler<PasswordRecoveryCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    @Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>,
  ) {}

  async execute(command: PasswordRecoveryCommand) {
    const code = crypto.randomUUID();

    const expiration = new Date();
    const hours = expiration.getHours();
    expiration.setHours(hours + this.auth.recoveryCodeExpiresIn);

    const result = await this.usersRepository.updateRecoveryCode({
      email: command.email,
      code,
      expiration,
    });

    if (!result) {
      return;
    }

    await this.emailService.sendRecoveryCode(command.email, code);
  }
}
