import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../infrastructure/typeorm/users.query-repository.js';
import { CurrentUserViewModel } from '../../types/users.types.js';

export class GetCurrentUserQuery extends Query<CurrentUserViewModel> {
  constructor(public readonly userId: string) {
    super();
  }
}

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserUseCase implements IQueryHandler<GetCurrentUserQuery> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute(query: GetCurrentUserQuery) {
    return await this.usersQueryRepository.getCurrentUser(query.userId);
  }
}
