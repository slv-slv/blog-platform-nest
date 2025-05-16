import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schemas.js';
import {
  CONFIRMATION_STATUS,
  ConfirmationInfoType,
  PasswordRecoveryInfoType,
  UserType,
  UserViewType,
} from '../../users.types.js';
import { ObjectId } from 'mongodb';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly model: Model<User>,
    @Inject(pool) private readonly pool: Pool,
  ) {}

  // async findUser(loginOrEmail: string): Promise<UserType | null> {
  //   const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
  //   const user = await this.model.findOne(filter).lean();
  //   if (!user) {
  //     return null;
  //   }
  //   const { _id, login, email, hash, createdAt, confirmation, passwordRecovery } = user;
  //   const id = _id.toString();
  //   return { id, login, email, hash, createdAt, confirmation, passwordRecovery };
  // }

  async findUser(loginOrEmail: string): Promise<UserType | null> {
    const usersResult = await this.pool.query(
      `
        SELECT id, login, email, hash, created_at
        FROM users
        WHERE login LIKE '%$1%' OR email LIKE '%$1%'
      `,
      [loginOrEmail],
    );

    if (usersResult.rowCount === 0) {
      return null;
    }

    const { id, login, email, hash, createdAt } = usersResult.rows[0];

    const confirmationResult = await this.pool.query(
      `
        SELECT status, code, expiration
        FROM confirmation
        WHERE user_id = $1
      `,
      [id],
    );
    const confirmation = confirmationResult.rows[0];

    const recoveryResult = await this.pool.query(
      `
        SELECT code, expiration
        FROM recovery
        WHERE user_id = $1
      `,
      [id],
    );
    const passwordRecovery = recoveryResult.rows[0];

    return { id, login, email, hash, createdAt, confirmation, passwordRecovery };
  }

  // async getLogin(id: string): Promise<string | null> {
  //   const _id = new ObjectId(id);
  //   const user = await this.model.findById(_id, { login: 1 }).lean();
  //   if (!user) return null;
  //   return user.login;
  // }

  async getLogin(id: string): Promise<string | null> {
    const result = await this.pool.query(
      `
        SELECT login
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { login } = result.rows[0];
    return login;
  }

  // async createUser(
  //   login: string,
  //   email: string,
  //   hash: string,
  //   createdAt: string,
  //   confirmation: ConfirmationInfoType,
  //   passwordRecovery: PasswordRecoveryInfoType,
  // ): Promise<UserType> {
  //   const _id = new ObjectId();
  //   const newUser = { _id, login, email, hash, createdAt, confirmation, passwordRecovery };
  //   await this.model.insertOne(newUser);
  //   const id = _id.toString();
  //   return { id, login, email, createdAt };
  // }

  async createUser(
    login: string,
    email: string,
    hash: string,
    createdAt: string,
    confirmation: ConfirmationInfoType,
    passwordRecovery: PasswordRecoveryInfoType,
  ): Promise<UserViewType> {
    let id: number;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `
          INSERT INTO users (login, email, hash, created_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `,
        [login, email, hash, createdAt],
      );
      id = result.rows[0].id;
      await client.query(
        `
          INSERT INTO confirmation
            VALUES ($1, $2, $3, $4)
        `,
        [id, confirmation.status, confirmation.code, confirmation.expiration],
      );
      await client.query(
        `
          INSERT INTO recovery
            VALUES ($1, $2, $3)
        `,
        [id, passwordRecovery.code, passwordRecovery.expiration],
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return { id: id.toString(), login, email, createdAt };
  }

  // async updateConfirmationCode(email: string, code: string, expiration: string): Promise<void> {
  //   await this.model.updateOne(
  //     { email },
  //     { $set: { 'confirmation.code': code, 'confirmation.expiration': expiration } },
  //   );
  // }

  async updateConfirmationCode(email: string, code: string, expiration: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE confirmation
          SET code = $2, expiration = $3
          WHERE user_id = (SELECT id FROM users WHERE email = $1)
      `,
      [email, code, expiration],
    );
  }

  // async updateRecoveryCode(email: string, code: string, expiration: string): Promise<boolean> {
  //   const updateResult = await this.model.updateOne(
  //     { email },
  //     { $set: { 'passwordRecovery.code': code, 'passwordRecovery.expiration': expiration } },
  //   );

  //   return updateResult.modifiedCount > 0;
  // }

  async updateRecoveryCode(email: string, code: string, expiration: string): Promise<boolean> {
    const updateResult = await this.pool.query(
      `
        UPDATE recovery
          SET code = $2, expiration = $3
          WHERE user_id = (SELECT id FROM users WHERE email = $1)
      `,
      [email, code, expiration],
    );

    return updateResult.rowCount! > 0;
  }

  // async updatePassword(recoveryCode: string, hash: string): Promise<void> {
  //   await this.model.updateOne(
  //     { 'passwordRecovery.code': recoveryCode },
  //     { $set: { hash, 'passwordRecovery.code': null, 'passwordRecovery.expiration': null } },
  //   );
  // }

  async updatePassword(recoveryCode: string, hash: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE users
          SET hash = $2
          WHERE id = (SELECT user_id FROM recovery WHERE code = $1)
      `,
      [recoveryCode, hash],
    );
  }

  // async confirmUser(code: string): Promise<void> {
  //   await this.model.updateOne(
  //     { 'confirmation.code': code },
  //     { $set: { 'confirmation.status': CONFIRMATION_STATUS.CONFIRMED, 'confirmation.expiration': null } },
  //   );
  //   // return updateResult.modifiedCount > 0; // Будет false если пользователь не найден или уже подтвержден
  // }

  async confirmUser(code: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE confirmation
          SET status = $2, expiration = $3
          WHERE code = $1
      `,
      [code, CONFIRMATION_STATUS.CONFIRMED, null],
    );
  }

  // async deleteUser(id: string): Promise<boolean> {
  //   if (!ObjectId.isValid(id)) {
  //     return false;
  //   }
  //   const _id = new ObjectId(id);
  //   const deleteResult = await this.model.deleteOne({ _id });
  //   return deleteResult.deletedCount > 0;
  // }

  async deleteUser(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const deleteResult = await this.pool.query(
        `
          DELETE FROM confirmation
            WHERE user_id = $1
        `,
        [id],
      );
      if (deleteResult.rowCount === 0) {
        return false;
      }
      await this.pool.query(
        `
          DELETE FROM recovery
            WHERE user_id = $1
        `,
        [id],
      );
      await this.pool.query(
        `
          DELETE FROM user
            WHERE id = $1
        `,
        [id],
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return true;
  }
}
