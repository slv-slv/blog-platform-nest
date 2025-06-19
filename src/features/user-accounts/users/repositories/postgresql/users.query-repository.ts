import { Inject, Injectable } from '@nestjs/common';
import { PagingParamsType } from '../../../../../common/types/paging-params.types.js';
import {
  ConfirmationInfoType,
  CurrentUserType,
  PasswordRecoveryInfoType,
  UsersPaginatedType,
  UserViewType,
} from '../../types/users.types.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class UsersQueryRepository {
  constructor(@Inject(pool) private readonly pool: Pool) {}

  async getAllUsers(
    searchLoginTerm: string | null,
    searchEmailTerm: string | null,
    pagingParams: PagingParamsType,
  ): Promise<UsersPaginatedType> {
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
        SELECT COUNT(id)
        FROM users
        ${whereClause}
      `,
    );

    const totalCount = parseInt(countResult.rows[0].count);
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
      createdAt: user.created_at,
    }));

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: users,
    };
  }

  async findUser(loginOrEmail: string): Promise<UserViewType | null> {
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
      return null;
    }

    const { id, login, email, createdAt } = result.rows[0];

    return { id: id.toString(), login, email, createdAt };
  }

  async getCurrentUser(userId: string): Promise<CurrentUserType | null> {
    const idInt = Number.parseInt(userId);

    const result = await this.pool.query(
      `
        SELECT login, email
        FROM users
        WHERE id = $1
      `,
      [idInt],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { login, email } = result.rows[0];

    return { login, email, userId };
  }

  async isConfirmed(loginOrEmail: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT confirmation.isConfirmed
        FROM users JOIN confirmation
          ON users.id = confirmation.user_id
        WHERE users.login = $1 OR users.email = $1
      `,
      [loginOrEmail],
    );

    const { isConfirmed } = result.rows[0];
    return isConfirmed;
  }

  async getConfirmationInfo(code: string): Promise<ConfirmationInfoType | null> {
    const result = await this.pool.query(
      `
        SELECT isConfirmed, expiration FROM confirmation
        WHERE code = $1
      `,
      [code],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { isConfirmed, expiration } = result.rows[0];
    return { isConfirmed, code, expiration };
  }

  async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoType | null> {
    const result = await this.pool.query(
      `
        SELECT expiration FROM recovery
        WHERE code = $1
      `,
      [code],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { expiration } = result.rows[0];
    return { code, expiration };
  }

  async isLoginUnique(login: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT id from users
        WHERE login = $1
      `,
      [login],
    );

    return result.rowCount === 0;
  }

  async isEmailUnique(email: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT id from users
        WHERE email = $1
      `,
      [email],
    );

    return result.rowCount === 0;
  }

  async getPasswordHash(loginOrEmail: string): Promise<string | null> {
    const result = await this.pool.query(
      `
        SELECT hash from users
        WHERE login = $1 OR email = $1
      `,
      [loginOrEmail],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { hash } = result.rows[0];
    return hash;
  }
}
