import { registerAs } from '@nestjs/config';
import { plainToInstance, Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsNotEmpty, IsString, Max, Min, ValidateNested } from 'class-validator';
import { PagingParamsType, SortDirection } from '../common/types/paging-params.types.js';
import { validateOrThrow } from './validate-or-throw.js';

class PagingDefaultParamsSchema implements PagingParamsType {
  @IsString()
  @IsNotEmpty()
  declare sortBy: string;

  @IsEnum(SortDirection)
  declare sortDirection: SortDirection;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  declare pageNumber: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  declare pageSize: number;
}

class CoreConfigSchema {
  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  declare port: number;

  @ValidateNested()
  @Type(() => PagingDefaultParamsSchema)
  @IsDefined()
  declare pagingDefaultParams: PagingDefaultParamsSchema;

  @IsInt()
  @Min(0)
  declare newestLikesNumber: number;
}

export const coreConfig = registerAs('core', () => {
  const coreConfigEnvInput = {
    port: process.env.PORT,
    pagingDefaultParams: {
      sortBy: 'createdAt',
      sortDirection: SortDirection.desc,
      pageNumber: 1,
      pageSize: 10,
    },
    newestLikesNumber: 3,
  };

  const coreConfigEnv = plainToInstance(CoreConfigSchema, coreConfigEnvInput);
  return validateOrThrow(coreConfigEnv, 'core config');
});
