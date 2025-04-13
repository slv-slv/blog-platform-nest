import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { SETTINGS } from '../../settings.js';
import { SortDirection } from '../types/paging-params.types.js';

@Injectable()
export class BasicPagingParamsPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    value.sortDirection ??= SETTINGS.PAGING_DEFAULT_PARAMS.sortDirection;
    if (!Object.values(SortDirection).includes(value.sortDirection)) {
      throw new BadRequestException(`Invalid sort direction value`);
    }

    value.pageNumber = value.pageNumber ? +value.pageNumber : SETTINGS.PAGING_DEFAULT_PARAMS.pageNumber;
    if (isNaN(value.pageNumber) || value.pageNumber < 1 || !Number.isInteger(value)) {
      throw new BadRequestException(`Invalid page number value`);
    }

    value.pageSize = value.pageSize ? +value.pageSize : SETTINGS.PAGING_DEFAULT_PARAMS.pageSize;
    if (isNaN(value.pageSize) || value.pageSize < 1 || !Number.isInteger(value)) {
      throw new BadRequestException(`Invalid page size value`);
    }

    return value;
  }
}
