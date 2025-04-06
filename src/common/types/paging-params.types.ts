import { IsEnum, IsNumberString } from 'class-validator';

export enum SortDirection {
  asc = 'asc',
  desc = 'desc',
}

export class BasicPagingParams {
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.desc;

  @IsNumberString()
  pageNumber: number = 1;

  @IsNumberString()
  pageSize: number = 10;
}
