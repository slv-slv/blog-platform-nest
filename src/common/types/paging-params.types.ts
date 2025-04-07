import { IsEnum, IsNumberString, IsOptional } from 'class-validator';

export enum SortDirection {
  asc = 'asc',
  desc = 'desc',
}

export class BasicPagingParams {
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.desc;

  @IsOptional()
  @IsNumberString()
  pageNumber: number = 1;

  @IsOptional()
  @IsNumberString()
  pageSize: number = 10;
}
