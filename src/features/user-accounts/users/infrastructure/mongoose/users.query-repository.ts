import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.schemas.js';
import { Model } from 'mongoose';
import { PagingParamsType } from '../../../../../common/types/paging-params.types.js';
import {
  CONFIRMATION_STATUS,
  ConfirmationInfoType,
  CurrentUserType,
  PasswordRecoveryInfoType,
  UsersPaginatedType,
  UserViewType,
} from '../../users.types.js';
import { ObjectId } from 'mongodb';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name) private readonly model: Model<User>,
    @Inject(pool) private readonly pool: Pool,
  ) {}

  // async getAllUsers(
  //   searchLoginTerm: string | null,
  //   searchEmailTerm: string | null,
  //   pagingParams: PagingParamsType,
  // ): Promise<UsersPaginatedType> {
  //   const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

  //   let filter = {};
  //   const loginFilter = searchLoginTerm ? { login: { $regex: searchLoginTerm, $options: 'i' } } : {};
  //   const emailFilter = searchEmailTerm ? { email: { $regex: searchEmailTerm, $options: 'i' } } : {};

  //   if (searchEmailTerm && searchLoginTerm) {
  //     filter = { $or: [loginFilter, emailFilter] };
  //   } else if (searchEmailTerm) {
  //     filter = emailFilter;
  //   } else if (searchLoginTerm) {
  //     filter = loginFilter;
  //   }

  //   const totalCount = await this.model.countDocuments(filter);
  //   const pagesCount = Math.ceil(totalCount / pageSize);

  //   const usersWithObjectId = await this.model
  //     .find(filter, { hash: 0 })
  //     .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
  //     .skip((pageNumber - 1) * pageSize)
  //     .limit(pageSize)
  //     .lean();

  //   const users = usersWithObjectId.map((user) => {
  //     return {
  //       id: user._id.toString(),
  //       login: user.login,
  //       email: user.email,
  //       createdAt: user.createdAt,
  //     };
  //   });

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

    searchLoginTerm ??= '%';
    searchEmailTerm ??= '%';

    const countResult = await this.pool.query(
      `
        SELECT id
        FROM users
        WHERE login ILIKE $1 OR email ILIKE $2
      `,
      [searchLoginTerm, searchEmailTerm],
    );

    const totalCount = countResult.rowCount!;
    const pagesCount = Math.ceil(totalCount / pageSize);
    const skipCount = (pageNumber - 1) * pageSize;

    const usersResult = await this.pool.query(
      `
        SELECT id, login, email, created_at
        FROM users
        WHERE login ILIKE $1 OR email ILIKE $2
        ORDER BY $3 $4
        LIMIT $5
        OFFSET $6
      `,
      [searchLoginTerm, searchEmailTerm, sortBy, sortDirection, pageSize, skipCount],
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

  // async findUser(loginOrEmail: string): Promise<UserViewType | null> {
  //   const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
  //   const user = await this.model.findOne(filter, { hash: 0 }).lean();
  //   if (!user) {
  //     return null;
  //   }
  //   const { _id, login, email, createdAt } = user;
  //   const id = _id.toString();
  //   return { id, login, email, createdAt };
  // }

  async findUser(loginOrEmail: string): Promise<UserViewType | null> {
    const result = await this.pool.query(
      `
        SELECT id, login, email, created_at
        FROM users
        WHERE login LIKE '%$1%' OR email LIKE '%$1%'
      `,
      [loginOrEmail],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { id, login, email, createdAt } = result.rows[0];

    return { id, login, email, createdAt };
  }

  // async getCurrentUser(userId: string): Promise<CurrentUserType | null> {
  //   const _id = new ObjectId(userId);
  //   const user = await this.model.findOne({ _id }, { email: 1, login: 1 }).lean();
  //   if (!user) {
  //     return null;
  //   }
  //   const { email, login } = user;
  //   return { email, login, userId };
  // }

  async getCurrentUser(userId: string): Promise<CurrentUserType | null> {
    const result = await this.pool.query(
      `
        SELECT login, email
        FROM users
        WHERE id = $1
      `,
      [userId],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { login, email } = result.rows[0];

    return { login, email, userId };
  }

  // async isConfirmed(loginOrEmail: string): Promise<boolean> {
  //   const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
  //   const user = await this.model.findOne(filter, { _id: 0, 'confirmation.status': 1 }).lean();
  //   if (!user) {
  //     return false;
  //   }
  //   return user.confirmation.status === CONFIRMATION_STATUS.CONFIRMED;
  // }

  async isConfirmed(loginOrEmail: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT confirmation.status
        FROM users JOIN confirmation
          ON users.id = confirmation.user_id
        WHERE users.login = $1 OR users.email = $1
      `,
      [loginOrEmail],
    );

    const { status } = result.rows[0];
    return status === CONFIRMATION_STATUS.CONFIRMED;
  }

  // async getConfirmationInfo(code: string): Promise<ConfirmationInfoType | null> {
  //   const user = await this.model.findOne({ 'confirmation.code': code }, { confirmation: 1 }).lean();
  //   if (!user) {
  //     return null;
  //   }
  //   return user.confirmation;
  // }

  async getConfirmationInfo(code: string): Promise<ConfirmationInfoType | null> {
    const result = await this.pool.query(
      `
        SELECT status, expiration FROM confirmation
        WHERE code = $1
      `,
      [code],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { status, expiration } = result.rows[0];
    return { status, code, expiration };
  }

  // async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoType | null> {
  //   const user = await this.model.findOne({ 'passwordRecovery.code': code }, { passwordRecovery: 1 }).lean();
  //   if (!user) {
  //     return null;
  //   }
  //   return user.passwordRecovery;
  // }

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

  // async isLoginUnique(login: string): Promise<boolean> {
  //   const loginCount = await this.model.countDocuments({ login });
  //   return loginCount === 0;
  // }

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

  // async isEmailUnique(email: string): Promise<boolean> {
  //   const emailCount = await this.model.countDocuments({ email });
  //   return emailCount === 0;
  // }

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

  // async getPasswordHash(loginOrEmail: string): Promise<string | null> {
  //   const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
  //   const user = await this.model.findOne(filter, { _id: 0, hash: 1 }).lean();
  //   if (!user) {
  //     return null;
  //   }
  //   return user.hash;
  // }

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
