import { ArgumentMetadata, BadRequestException, Inject, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SortDirection } from '../types/paging-params.types.js';
import { coreConfig } from '../../config/core.config.js';

@Injectable()
export class BasicPagingParamsPipe implements PipeTransform {
  constructor(@Inject(coreConfig.KEY) private readonly core: ConfigType<typeof coreConfig>) {}

  transform(value: any, metadata: ArgumentMetadata) {
    value.sortDirection ??= this.core.pagingDefaultParams.sortDirection;
    if (!Object.values(SortDirection).includes(value.sortDirection)) {
      throw new BadRequestException(`Invalid sort direction value`);
    }

    value.pageNumber = value.pageNumber ? +value.pageNumber : this.core.pagingDefaultParams.pageNumber;
    if (isNaN(value.pageNumber) || value.pageNumber < 1 || !Number.isInteger(value)) {
      throw new BadRequestException(`Invalid page number value`);
    }

    value.pageSize = value.pageSize ? +value.pageSize : this.core.pagingDefaultParams.pageSize;
    if (isNaN(value.pageSize) || value.pageSize < 1 || !Number.isInteger(value)) {
      throw new BadRequestException(`Invalid page size value`);
    }

    return value;
  }
}
