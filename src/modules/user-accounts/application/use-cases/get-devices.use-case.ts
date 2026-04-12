import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { DeviceViewModel } from '../../types/sessions.types.js';
import { Inject } from '@nestjs/common';
import { SessionsQueryRepository } from '../../infrastructure/typeorm/sessions.query-repository.js';

export class GetDevicesQuery extends Query<DeviceViewModel[]> {
  constructor(public readonly userId: string) {
    super();
  }
}

@QueryHandler(GetDevicesQuery)
export class GetDevicesUseCase implements IQueryHandler<GetDevicesQuery> {
  constructor(@Inject(SessionsQueryRepository) private sessionsQueryRepository: SessionsQueryRepository) {}
  async execute(query: GetDevicesQuery) {
    return this.sessionsQueryRepository.getActiveDevices(query.userId);
  }
}
