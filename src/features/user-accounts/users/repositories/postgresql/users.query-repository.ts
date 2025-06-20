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
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../typeorm/users.entities.js';
import { ILike, Like, Repository } from 'typeorm';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @Inject(pool) private readonly pool: Pool,
    @InjectRepository(User) private readonly userEntityRepo: Repository<User>,
  ) {}

  // async getAllUsers(
  //   searchLoginTerm: string | null,
  //   searchEmailTerm: string | null,
  //   pagingParams: PagingParamsType,
  // ): Promise<UsersPaginatedType> {
  //   const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

  //   const orderBy = sortBy === 'createdAt' ? 'created_at' : sortBy;
  //   // searchLoginTerm ??= '%';
  //   // searchEmailTerm ??= '%';

  //   const whereParams = [];

  //   if (searchLoginTerm) {
  //     whereParams.push(`login ILIKE '%${searchLoginTerm}%'`);
  //   }

  //   if (searchEmailTerm) {
  //     whereParams.push(`email ILIKE '%${searchEmailTerm}%'`);
  //   }

  //   const whereClause = whereParams.length > 0 ? `WHERE ${whereParams.join(' OR ')}` : ``;

  //   const countResult = await this.pool.query(
  //     `
  //       SELECT COUNT(id)
  //       FROM users
  //       ${whereClause}
  //     `,
  //   );

  //   const totalCount = parseInt(countResult.rows[0].count);
  //   const pagesCount = Math.ceil(totalCount / pageSize);
  //   const skipCount = (pageNumber - 1) * pageSize;

  //   const usersResult = await this.pool.query(
  //     `
  //       SELECT id, login, email, created_at
  //       FROM users
  //       ${whereClause}
  //       ORDER BY ${orderBy} ${sortDirection}
  //       LIMIT $1
  //       OFFSET $2
  //     `,
  //     [pageSize, skipCount],
  //   );

  //   const rawUsers = usersResult.rows;

  //   const users = rawUsers.map((user) => ({
  //     id: user.id.toString(),
  //     login: user.login,
  //     email: user.email,
  //     createdAt: user.created_at,
  //   }));

  //   return {
  //     pagesCount,
  //     page: pageNumber,
  //     pageSize,
  //     totalCount,
  //     items: users,
  //   };
  // }

  async getAllUsers(
    searchLoginTerm: string | null,
    searchEmailTerm: string | null,
    pagingParams: PagingParamsType,
  ): Promise<UsersPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const whereParams = [];

    if (searchLoginTerm) {
      whereParams.push({ login: ILike(`%${searchLoginTerm}%`) });
    }

    if (searchEmailTerm) {
      whereParams.push({ email: ILike(`%${searchEmailTerm}%`) });
    }

    const [users, totalCount] = await this.userEntityRepo.findAndCount({
      select: ['id', 'login', 'email', 'createdAt'],
      where: whereParams.length > 0 ? whereParams : {},
      order: { [sortBy]: sortDirection },
      take: pageSize,
      skip: (pageNumber - 1) * pageSize,
    });

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items: users.map((user) => user.toViewType()),
    };
  }

  // async findUser(loginOrEmail: string): Promise<UserViewType | null> {
  //   const likeTerm = `%${loginOrEmail}%`;
  //   const result = await this.pool.query(
  //     `
  //       SELECT id, login, email, created_at
  //       FROM users
  //       WHERE login LIKE $1 OR email LIKE $1
  //     `,
  //     [likeTerm],
  //   );

  //   if (result.rowCount === 0) {
  //     return null;
  //   }

  //   const { id, login, email, created_at } = result.rows[0];

  //   return { id: id.toString(), login, email, createdAt: created_at };
  // }

  async findUser(loginOrEmail: string): Promise<UserViewType | null> {
    const likeTerm = `%${loginOrEmail}%`;

    const user = await this.userEntityRepo.findOne({
      select: ['id', 'login', 'email', 'createdAt'],
      where: [{ login: Like(likeTerm) }, { email: Like(likeTerm) }],
    });

    if (!user) return null;

    return user.toViewType();
  }

  // async getCurrentUser(userId: string): Promise<CurrentUserType | null> {
  //   const idInt = Number.parseInt(userId);

  //   const result = await this.pool.query(
  //     `
  //       SELECT login, email
  //       FROM users
  //       WHERE id = $1
  //     `,
  //     [idInt],
  //   );

  //   if (result.rowCount === 0) {
  //     return null;
  //   }

  //   const { login, email } = result.rows[0];

  //   return { login, email, userId };
  // }

  async getCurrentUser(userId: string): Promise<CurrentUserType | null> {
    const user = await this.userEntityRepo.findOne({
      select: ['id', 'login', 'email'],
      where: { id: Number.parseInt(userId) },
    });

    if (!user) return null;

    return user.toCurrentUserType();
  }

  // async isConfirmed(loginOrEmail: string): Promise<boolean> {
  //   const result = await this.pool.query(
  //     `
  //       SELECT is_confirmed
  //       FROM users
  //       WHERE login = $1 OR email = $1
  //     `,
  //     [loginOrEmail],
  //   );

  //   const { is_confirmed } = result.rows[0];  // Проверка существования пользователя выполняется в сервисе или middleware
  //   return is_confirmed;
  // }

  async isConfirmed(loginOrEmail: string): Promise<boolean> {
    const user = await this.userEntityRepo.findOne({
      select: { confirmation: { isConfirmed: true } },
      where: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });

    return user!.confirmation.isConfirmed === true; // Проверка существования пользователя выполняется в сервисе или middleware
  }

  async isLoginExists(login: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT id from users
        WHERE login = $1
      `,
      [login],
    );

    return result.rowCount === 0;
  }

  async isEmailExists(email: string): Promise<boolean> {
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
