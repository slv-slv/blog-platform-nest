import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../infrastructure/typeorm/games.query-repository.js';
import { GameViewModel } from '../../types/game.types.js';

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
  constructor(private readonly gamesQueryRepository: GamesQueryRepository) {}

  async execute(query: GetGameByIdQuery): Promise<GameViewModel> {
    return this.gamesQueryRepository.getGameViewModelForUser(query.gameId, query.userId);
  }
}
