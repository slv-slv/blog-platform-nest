import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../infrastructure/typeorm/games.query-repository.js';
import { MyStatisticViewModel } from '../../types/game.types.js';

export class GetMyStatisticQuery extends Query<MyStatisticViewModel> {
  constructor(public readonly userId: string) {
    super();
  }
}

@QueryHandler(GetMyStatisticQuery)
export class GetMyStatisticUseCase implements IQueryHandler<GetMyStatisticQuery> {
  constructor(private readonly gamesQueryRepository: GamesQueryRepository) {}

  async execute(query: GetMyStatisticQuery) {
    return this.gamesQueryRepository.getMyStatistic(query.userId);
  }
}
