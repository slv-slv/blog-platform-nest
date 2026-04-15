import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { UserId } from '../../common/decorators/userId.js';
import { AccessTokenGuard } from '../../common/guards/access-token.guard.js';
import { GetCurrentGameQuery } from '../application/use-cases/get-current-game.use-case.js';
import { GameViewModel } from '../types/game.types.js';

@Controller('pair-game-quiz/pairs')
@UseGuards(AccessTokenGuard)
export class QuizGameController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('my-current')
  async getCurrentGame(@UserId() userId: string): Promise<GameViewModel> {
    return this.queryBus.execute(new GetCurrentGameQuery(userId));
  }
}
