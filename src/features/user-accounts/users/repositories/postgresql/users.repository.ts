import { Inject, Injectable } from '@nestjs/common';
import {
  ConfirmationInfoType,
  PasswordRecoveryInfoType,
  UserType,
  UserViewType,
} from '../../types/users.types.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../typeorm/users.entities.js';
import { Like, Repository } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(pool) private readonly pool: Pool,
    @InjectRepository(User) private readonly userEntityRepo: Repository<User>,
  ) {}

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

  // async findUserTypeorm(loginOrEmail: string): Promise<UserType | null> {
  //   const likeTerm = `%${loginOrEmail}%`;
  //   const user = await this.userEntityRepo.find({
  //     relations: { confirmation: true, passwordRecovery: true },
  //     where: [{ login: Like(likeTerm) }, { email: Like(likeTerm) }],
  //   });
  // }

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

  async createUser(
    login: string,
    email: string,
    hash: string,
    createdAt: string,
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

    return { id: id.toString(), login, email, createdAt };
  }

  async updateConfirmationCode(email: string, code: string, expiration: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE users
          SET confirmation_code = $2, confirmation_expiration = $3
          WHERE email = $1
      `,
      [email, code, expiration],
    );
  }

  async updateRecoveryCode(email: string, code: string, expiration: string): Promise<boolean> {
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

    await this.pool.query(
      `
          DELETE FROM users
            WHERE id = $1
        `,
      [idInt],
    );

    return true;
  }
}
