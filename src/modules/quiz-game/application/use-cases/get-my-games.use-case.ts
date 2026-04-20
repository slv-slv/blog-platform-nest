import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../infrastructure/typeorm/games.query-repository.js';
import { GamesPaginatedViewModel, GetMyGamesParams } from '../../types/game.types.js';

export class GetMyGamesQuery extends Query<GamesPaginatedViewModel> {
  constructor(
    public readonly userId: string,
    public readonly params: GetMyGamesParams,
  ) {
    super();
  }
}

@QueryHandler(GetMyGamesQuery)
export class GetMyGamesUseCase implements IQueryHandler<GetMyGamesQuery> {
  constructor(private readonly gamesQueryRepository: GamesQueryRepository) {}

  async execute(query: GetMyGamesQuery) {
    return this.gamesQueryRepository.getMyGames(query.userId, query.params);
  }
}
