import { Inject, Injectable } from '@nestjs/common';
import {
  ConfirmationInfoType,
  PasswordRecoveryInfoType,
  UserType,
  UserViewType,
} from '../../types/users.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findUser(loginOrEmail: string): Promise<UserType | null> {
    const likeTerm = `%${loginOrEmail}%`;
    const usersResult = await this.pool.query(
      `
        SELECT *
        FROM users
        WHERE login LIKE $1 OR email LIKE $1
      `,
      [likeTerm],
    );

    if (usersResult.rowCount === 0) {
      return null;
    }

    const {
      id,
      login,
      email,
      hash,
      created_at,
      is_confirmed,
      confirmation_code,
      confirmation_expiration,
      recovery_code,
      recovery_expiration,
    } = usersResult.rows[0];

    const confirmation = {
      isConfirmed: is_confirmed,
      code: confirmation_code,
      expiration: confirmation_expiration,
    };

    const passwordRecovery = {
      code: recovery_code,
      expiration: recovery_expiration,
    };

    return { id: id.toString(), login, email, hash, createdAt: created_at, confirmation, passwordRecovery };
  }
  async getLogin(id: string): Promise<string | null> {
    const idInt = Number.parseInt(id);

    const result = await this.pool.query(
      `
        SELECT login
        FROM users
        WHERE id = $1
      `,
      [idInt],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { login } = result.rows[0];
    return login;
  }
  async getConfirmationInfo(code: string): Promise<ConfirmationInfoType | null> {
    const result = await this.pool.query(
      `
        SELECT is_confirmed, confirmation_expiration
        FROM users
        WHERE confirmation_code = $1
      `,
      [code],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { is_confirmed: isConfirmed, confirmation_expiration: expiration } = result.rows[0];
    return { isConfirmed, code, expiration };
  }
  async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoType | null> {
    const result = await this.pool.query(
      `
        SELECT recovery_expiration FROM users
        WHERE recovery_code = $1
      `,
      [code],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const { recovery_expiration: expiration } = result.rows[0];
    return { code, expiration };
  }
  async createUser(
    login: string,
    email: string,
    hash: string,
    createdAt: Date,
    confirmation: ConfirmationInfoType,
    passwordRecovery: PasswordRecoveryInfoType,
  ): Promise<UserViewType> {
    let id: number;
    const result = await this.pool.query(
      `
          INSERT INTO users (
            login,
            email,
            hash,
            created_at,
            is_confirmed,
            confirmation_code,
            confirmation_expiration,
            recovery_code,
            recovery_expiration
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `,
      [
        login,
        email,
        hash,
        createdAt,
        confirmation.isConfirmed,
        confirmation.code,
        confirmation.expiration,
        passwordRecovery.code,
        passwordRecovery.expiration,
      ],
    );
    id = result.rows[0].id;

    return { id: id.toString(), login, email, createdAt: createdAt.toISOString() };
  }
  async updateConfirmationCode(email: string, code: string, expiration: Date): Promise<void> {
    await this.pool.query(
      `
        UPDATE users
          SET confirmation_code = $2, confirmation_expiration = $3
          WHERE email = $1
      `,
      [email, code, expiration],
    );
  }
  async updateRecoveryCode(email: string, code: string, expiration: Date): Promise<boolean> {
    const updateResult = await this.pool.query(
      `
        UPDATE users
          SET recovery_code = $2, recovery_expiration = $3
          WHERE email = $1
      `,
      [email, code, expiration],
    );

    return updateResult.rowCount! > 0;
  }
  async updatePassword(recoveryCode: string, hash: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE users
          SET hash = $2
          WHERE recovery_code = $1
      `,
      [recoveryCode, hash],
    );
  }
  async confirmUser(code: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE users
          SET is_confirmed = true, confirmation_expiration = NULL
          WHERE confirmation_code = $1
      `,
      [code],
    );
  }
  async deleteUser(id: string): Promise<boolean> {
    const idInt = Number.parseInt(id);

    const deleteResult = await this.pool.query(
      `
          DELETE FROM users
            WHERE id = $1
        `,
      [idInt],
    );

    return deleteResult.rowCount! > 0;
  }
}
