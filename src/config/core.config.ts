import { registerAs } from '@nestjs/config';
import { PagingParamsType } from '../common/types/paging-params.types.js';

export const coreConfig = registerAs('core', () => ({
  port: process.env.PORT!,
  pagingDefaultParams: {
    sortBy: 'createdAt',
    sortDirection: 'desc',
    pageNumber: 1,
    pageSize: 10,
  } as PagingParamsType,
  newestLikesNumber: 3,
}));
