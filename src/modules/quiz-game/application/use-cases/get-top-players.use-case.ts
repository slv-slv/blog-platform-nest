import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../infrastructure/typeorm/games.query-repository.js';
import { GetTopPlayersParams, TopPlayersPaginatedViewModel } from '../../types/game.types.js';

export class GetTopPlayersQuery extends Query<TopPlayersPaginatedViewModel> {
  constructor(public readonly params: GetTopPlayersParams) {
    super();
  }
}

@QueryHandler(GetTopPlayersQuery)
export class GetTopPlayersUseCase implements IQueryHandler<GetTopPlayersQuery> {
  constructor(private readonly gamesQueryRepository: GamesQueryRepository) {}

  async execute(query: GetTopPlayersQuery) {
    return this.gamesQueryRepository.getTopPlayers(query.params);
  }
}
