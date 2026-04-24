import { CommandBus, IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../infrastructure/typeorm/games.query-repository.js';
import { GameViewModel } from '../../types/game.types.js';
import { FinishExpiredGamesCommand } from './finish-expired-games.use-case.js';

export class GetCurrentGameQuery extends Query<GameViewModel> {
  constructor(public readonly userId: string) {
    super();
  }
}

@QueryHandler(GetCurrentGameQuery)
export class GetCurrentGameUseCase implements IQueryHandler<GetCurrentGameQuery> {
  constructor(
    private readonly gamesQueryRepository: GamesQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(query: GetCurrentGameQuery) {
    // await this.commandBus.execute(new FinishExpiredGamesCommand());
    return this.gamesQueryRepository.getCurrentGameViewModel(query.userId);
  }
}
