import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../infrastructure/typeorm/games.query-repository.js';
import { GameViewModel } from '../../types/game.types.js';

export class GetCurrentGameQuery extends Query<GameViewModel> {
  constructor(public readonly userId: string) {
    super();
  }
}

@QueryHandler(GetCurrentGameQuery)
export class GetCurrentGameUseCase implements IQueryHandler<GetCurrentGameQuery> {
  constructor(private readonly gamesQueryRepository: GamesQueryRepository) {}

  async execute(query: GetCurrentGameQuery) {
    return this.gamesQueryRepository.getCurrentGameViewModel(query.userId);
  }
}
