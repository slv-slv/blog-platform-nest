import { CommandBus, IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../infrastructure/typeorm/games.query-repository.js';
import { GameViewModel } from '../../types/game.types.js';
import { FinishExpiredGamesCommand } from './finish-expired-games.use-case.js';

export class GetGameByIdQuery extends Query<GameViewModel> {
  constructor(
    public readonly gameId: string,
    public readonly userId: string,
  ) {
    super();
  }
}

@QueryHandler(GetGameByIdQuery)
export class GetGameByIdUseCase implements IQueryHandler<GetGameByIdQuery> {
  constructor(
    private readonly gamesQueryRepository: GamesQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(query: GetGameByIdQuery) {
    await this.commandBus.execute(new FinishExpiredGamesCommand(query.gameId));
    return this.gamesQueryRepository.getGameViewModelForUser(query.gameId, query.userId);
  }
}
