import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { BlogsSortBy } from './blogs.types.js';

@Injectable()
export class GetBlogsQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    value.searchNameTerm ??= null;
    value.sortBy ??= BlogsSortBy.createdAt;
    if (!Object.values(BlogsSortBy).includes(value.sortBy)) {
      throw new BadRequestException('Invalid sortBy value');
    }

    return value;
  }
}
