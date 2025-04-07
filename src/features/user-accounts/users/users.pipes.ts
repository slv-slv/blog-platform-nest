import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { UsersSortBy } from './users.types.js';

@Injectable()
export class GetUsersQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    value.searchLoginTerm ??= null;
    value.searchEmailTerm ??= null;
    value.sortBy ??= UsersSortBy.createdAt;
    if (!Object.values(UsersSortBy).includes(value.sortBy)) {
      throw new BadRequestException('Invalid sortBy value');
    }

    return value;
  }
}
