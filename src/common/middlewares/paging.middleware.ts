import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SETTINGS } from '../../settings.js';
import { PagingParamsType } from '../types/paging-params.types.js';

@Injectable()
export class PagingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const sortBy = req.query.sortBy ?? SETTINGS.PAGING_DEFAULT_PARAMS.sortBy;
    const sortDirection = req.query.sortDirection
      ? req.query.sortDirection
      : SETTINGS.PAGING_DEFAULT_PARAMS.sortDirection;
    const pageNumber = req.query.pageNumber
      ? +req.query.pageNumber
      : SETTINGS.PAGING_DEFAULT_PARAMS.pageNumber;
    const pageSize = req.query.pageSize ? +req.query.pageSize : SETTINGS.PAGING_DEFAULT_PARAMS.pageSize;

    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize } as PagingParamsType;
    res.locals.pagingParams = pagingParams;

    next();
  }
}
