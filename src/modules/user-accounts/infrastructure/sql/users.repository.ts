import { Inject, Injectable } from '@nestjs/common';
import {
  ConfirmationInfoModel,
  CreateUserRepoParams,
  PasswordRecoveryInfoModel,
  UpdateConfirmationCodeParams,
  UpdateRecoveryCodeParams,
  UserModel,
  UserViewModel,
} from '../../types/users.types.js';
import { PG_POOL } from '../../../../common/constants.js';
import { Pool } from 'pg';
import {
  ConfirmationCodeInvalidDomainException,
  CredentialsIncorrectDomainException,
  IncorrectEmailDomainException,
  RecoveryCodeInvalidDomainException,
  UnauthorizedDomainException,
  UserNotFoundDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findUser(loginOrEmail: string): Promise<UserModel> {
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
      throw new IncorrectEmailDomainException();
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

  async getLogin(id: string): Promise<string> {
    if (!isPositiveIntegerString(id)) {
      throw new UnauthorizedDomainException();
    }

    const idNum = +id;

    const result = await this.pool.query(
      `
        SELECT login
        FROM users
        WHERE id = $1
      `,
      [idNum],
    );

    if (result.rowCount === 0) {
      throw new UnauthorizedDomainException();
    }

    const { login } = result.rows[0];
    return login;
  }

  async isConfirmed(loginOrEmail: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT is_confirmed
        FROM users
        WHERE login = $1 OR email = $1
      `,
      [loginOrEmail],
    );

    const { is_confirmed } = result.rows[0];
    return is_confirmed;
  }

  async isLoginExists(login: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT id
        FROM users
        WHERE login = $1
      `,
      [login],
    );

    return result.rowCount! > 0;
  }

  async isEmailExists(email: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        SELECT id
        FROM users
        WHERE email = $1
      `,
      [email],
    );

    return result.rowCount! > 0;
  }

  async getPasswordHash(loginOrEmail: string): Promise<string> {
    const result = await this.pool.query(
      `
        SELECT hash
        FROM users
        WHERE login = $1 OR email = $1
      `,
      [loginOrEmail],
    );

    if (result.rowCount === 0) {
      throw new CredentialsIncorrectDomainException();
    }

    const { hash } = result.rows[0];
    return hash;
  }

  async getConfirmationInfo(code: string): Promise<ConfirmationInfoModel> {
    const result = await this.pool.query(
      `
        SELECT is_confirmed, confirmation_expiration
        FROM users
        WHERE confirmation_code = $1
      `,
      [code],
    );

    if (result.rowCount === 0) {
      throw new ConfirmationCodeInvalidDomainException();
    }

    const { is_confirmed: isConfirmed, confirmation_expiration: expiration } = result.rows[0];
    return { isConfirmed, code, expiration };
  }

  async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoModel> {
    const result = await this.pool.query(
      `
        SELECT recovery_expiration FROM users
        WHERE recovery_code = $1
      `,
      [code],
    );

    if (result.rowCount === 0) {
      throw new RecoveryCodeInvalidDomainException();
    }

    const { recovery_expiration: expiration } = result.rows[0];
    return { code, expiration };
  }

  async createUser(params: CreateUserRepoParams): Promise<UserViewModel> {
    const { login, email, hash, createdAt, confirmation, passwordRecovery } = params;
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
  async updateConfirmationCode(params: UpdateConfirmationCodeParams): Promise<void> {
    const { email, code, expiration } = params;
    await this.pool.query(
      `
        UPDATE users
          SET confirmation_code = $2, confirmation_expiration = $3
          WHERE email = $1
      `,
      [email, code, expiration],
    );
  }
  async updateRecoveryCode(params: UpdateRecoveryCodeParams): Promise<boolean> {
    const { email, code, expiration } = params;
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
  async deleteUser(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new UserNotFoundDomainException();
    }

    const idNum = +id;

    const deleteResult = await this.pool.query(
      `
          DELETE FROM users
            WHERE id = $1
        `,
      [idNum],
    );

    if (deleteResult.rowCount === 0) {
      throw new UserNotFoundDomainException();
    }
  }
}
