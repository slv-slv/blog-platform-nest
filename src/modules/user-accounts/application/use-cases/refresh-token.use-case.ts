import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthService } from '../auth.service.js';
import { GenerateTokenPairParams, JwtPairType } from '../../types/auth.types.js';

export class RefreshTokenCommand extends Command<JwtPairType> {
  constructor(public readonly params: GenerateTokenPairParams) {
    super();
  }
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase implements ICommandHandler<RefreshTokenCommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: RefreshTokenCommand): Promise<JwtPairType> {
    return this.authService.createSessionTokens(command.params);
  }
}
