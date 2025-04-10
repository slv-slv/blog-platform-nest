import { Type } from 'class-transformer';
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
  @Type(() => Number)
  pageNumber: number = 1;

  @IsOptional()
  @IsNumberString()
  @Type(() => Number)
  pageSize: number = 10;
}

export type PagingParamsType = {
  sortBy: string;
  sortDirection: SortDirection;
  pageNumber: number;
  pageSize: number;
};
