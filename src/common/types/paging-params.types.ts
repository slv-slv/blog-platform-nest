import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

export enum SortDirection {
  asc = 'asc',
  desc = 'desc',
}

export class BasicPagingParams {
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.desc;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNumber: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize: number = 10;
}

export type PagingParamsType = {
  sortBy: string;
  sortDirection: SortDirection;
  pageNumber: number;
  pageSize: number;
};
