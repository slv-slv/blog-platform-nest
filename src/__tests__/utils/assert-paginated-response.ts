import { expect } from 'vitest';

type AssertPaginatedResponseParams = {
  body: Record<string, unknown>;
  pagesCount: number;
  page?: number;
  pageSize?: number;
  totalCount: number;
  itemsLength: number;
};

export function assertPaginatedResponse(params: AssertPaginatedResponseParams): void {
  const { body, pagesCount, page = 1, pageSize = 10, totalCount, itemsLength } = params;

  expect(Object.keys(body)).toHaveLength(5);
  expect(body).toHaveProperty('pagesCount', pagesCount);
  expect(body).toHaveProperty('page', page);
  expect(body).toHaveProperty('pageSize', pageSize);
  expect(body).toHaveProperty('totalCount', totalCount);
  expect(body).toHaveProperty('items');
  expect(Array.isArray(body.items)).toBe(true);
  expect(body.items).toHaveLength(itemsLength);
}
