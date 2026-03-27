import { Inject, Injectable } from '@nestjs/common';
import {
  CurrentUserViewModel,
  GetUsersParams,
  UsersPaginatedViewModel,
  UserViewModel,
} from '../../types/users.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import {
  UnauthorizedDomainException,
  UserNotFoundDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class UsersQueryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getUsers(params: GetUsersParams): Promise<UsersPaginatedViewModel> {
    const { searchLoginTerm, searchEmailTerm, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const orderBy = sortBy === 'createdAt' ? 'created_at' : sortBy;
    // searchLoginTerm ??= '%';
    // searchEmailTerm ??= '%';

    const whereParams = [];

    if (searchLoginTerm) {
      whereParams.push(`login ILIKE '%${searchLoginTerm}%'`);
    }

    if (searchEmailTerm) {
      whereParams.push(`email ILIKE '%${searchEmailTerm}%'`);
    }

    const whereClause = whereParams.length > 0 ? `WHERE ${whereParams.join(' OR ')}` : ``;

    const countResult = await this.pool.query(
      `
        SELECT COUNT(id)::int
        FROM users
        ${whereClause}
      `,
    );

    const totalCount = countResult.rows[0].count;
    const pagesCount = Math.ceil(totalCount / pageSize);
    const skipCount = (pageNumber - 1) * pageSize;

    const usersResult = await this.pool.query(
      `
        SELECT id, login, email, created_at
        FROM users
        ${whereClause}
        ORDER BY ${orderBy} ${sortDirection}
        LIMIT $1
        OFFSET $2
      `,
      [pageSize, skipCount],
    );

    const rawUsers = usersResult.rows;

    const users = rawUsers.map((user) => ({
      id: user.id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user.created_at.toISOString(),
    }));

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: users,
    };
  }
  async findUser(loginOrEmail: string): Promise<UserViewModel> {
    const likeTerm = `%${loginOrEmail}%`;
    const result = await this.pool.query(
      `
        SELECT id, login, email, created_at
        FROM users
        WHERE login LIKE $1 OR email LIKE $1
      `,
      [likeTerm],
    );

    if (result.rowCount === 0) {
      throw new UserNotFoundDomainException();
    }

    const { id, login, email, created_at } = result.rows[0];

    return { id: id.toString(), login, email, createdAt: created_at.toISOString() };
  }
  async getCurrentUser(userId: string): Promise<CurrentUserViewModel> {
    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException('User not found');
    }

    const userIdNum = +userId;

    const result = await this.pool.query(
      `
        SELECT login, email
        FROM users
        WHERE id = $1
      `,
      [userIdNum],
    );

    if (result.rowCount === 0) {
      throw new UnauthorizedDomainException('User not found');
    }

    const { login, email } = result.rows[0];

    return { login, email, userId };
  }
}
