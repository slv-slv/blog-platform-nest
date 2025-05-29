import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { PostsSortBy } from '../types/posts.types.js';

@Injectable()
export class GetPostsQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    value.sortBy ??= PostsSortBy.createdAt;
    if (!Object.values(PostsSortBy).includes(value.sortBy)) {
      throw new BadRequestException('Invalid sortBy value');
    }

    return value;
  }
}
