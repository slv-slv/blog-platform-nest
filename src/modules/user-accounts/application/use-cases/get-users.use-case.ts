import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GetUsersParams, UsersPaginatedType } from '../../types/users.types.js';
import { UsersQueryRepository } from '../../infrastructure/sql/users.query-repository.js';

export class GetUsersQuery extends Query<UsersPaginatedType> {
  constructor(public readonly params: GetUsersParams) {
    super();
  }
}

@QueryHandler(GetUsersQuery)
export class GetUsersUseCase implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}
  async execute(query: GetUsersQuery) {
    return await this.usersQueryRepository.getUsers(query.params);
  }
}
