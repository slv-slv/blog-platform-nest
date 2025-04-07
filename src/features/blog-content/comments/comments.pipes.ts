import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { CommentsSortBy } from './comments.types.js';

@Injectable()
export class GetCommentsQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    value.sortBy ??= CommentsSortBy.createdAt;
    if (!Object.values(CommentsSortBy).includes(value.sortBy)) {
      throw new BadRequestException('Invalid sortBy value');
    }

    return value;
  }
}
