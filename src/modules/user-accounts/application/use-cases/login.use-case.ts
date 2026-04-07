import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthService } from '../auth.service.js';
import { GenerateTokenPairParams, JwtPairType } from '../../types/auth.types.js';

export class LoginCommand extends Command<JwtPairType> {
  constructor(public readonly params: GenerateTokenPairParams) {
    super();
  }
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: LoginCommand): Promise<JwtPairType> {
    return await this.authService.generateTokenPair(command.params);
  }
}
