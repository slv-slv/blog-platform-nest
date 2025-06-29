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
import { ConfirmationInfo, PasswordRecoveryInfo, User } from '../typeorm/users.entities.js';
import { Like, Repository } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(pool) private readonly pool: Pool,
    @InjectRepository(User) private readonly userEntityRepo: Repository<User>,
  ) {}

  // async findUser(loginOrEmail: string): Promise<UserType | null> {
  //   const likeTerm = `%${loginOrEmail}%`;
  //   const usersResult = await this.pool.query(
  //     `
  //       SELECT *
  //       FROM users
  //       WHERE login LIKE $1 OR email LIKE $1
  //     `,
  //     [likeTerm],
  //   );

  //   if (usersResult.rowCount === 0) {
  //     return null;
  //   }

  //   const {
  //     id,
  //     login,
  //     email,
  //     hash,
  //     created_at,
  //     is_confirmed,
  //     confirmation_code,
  //     confirmation_expiration,
  //     recovery_code,
  //     recovery_expiration,
  //   } = usersResult.rows[0];

  //   const confirmation = {
  //     isConfirmed: is_confirmed,
  //     code: confirmation_code,
  //     expiration: confirmation_expiration,
  //   };

  //   const passwordRecovery = {
  //     code: recovery_code,
  //     expiration: recovery_expiration,
  //   };

  //   return { id: id.toString(), login, email, hash, createdAt: created_at, confirmation, passwordRecovery };
  // }

  async findUser(loginOrEmail: string): Promise<UserType | null> {
    const likeTerm = `%${loginOrEmail}%`;
    const user = await this.userEntityRepo.findOne({
      relations: { confirmation: true, passwordRecovery: true },
      where: [{ login: Like(likeTerm) }, { email: Like(likeTerm) }],
    });

    if (!user) return null;

    return user.toDto();
  }

  // async getLogin(id: string): Promise<string | null> {
  //   const idInt = Number.parseInt(id);

  //   const result = await this.pool.query(
  //     `
  //       SELECT login
  //       FROM users
  //       WHERE id = $1
  //     `,
  //     [idInt],
  //   );

  //   if (result.rowCount === 0) {
  //     return null;
  //   }

  //   const { login } = result.rows[0];
  //   return login;
  // }

  async getLogin(id: string): Promise<string | null> {
    const user = await this.userEntityRepo.findOne({
      select: { login: true },
      where: { id: Number.parseInt(id) },
    });

    if (!user) return null;
    return user.login;
  }

  // async getConfirmationInfo(code: string): Promise<ConfirmationInfoType | null> {
  //   const result = await this.pool.query(
  //     `
  //       SELECT is_confirmed, confirmation_expiration
  //       FROM users
  //       WHERE confirmation_code = $1
  //     `,
  //     [code],
  //   );

  //   if (result.rowCount === 0) {
  //     return null;
  //   }

  //   const { is_confirmed: isConfirmed, confirmation_expiration: expiration } = result.rows[0];
  //   return { isConfirmed, code, expiration };
  // }

  async getConfirmationInfo(code: string): Promise<ConfirmationInfoType | null> {
    const user = await this.userEntityRepo.findOne({
      select: { confirmation: true },
      where: { confirmation: { code } },
    });

    if (!user) return null;

    return user.confirmation;
  }

  // async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoType | null> {
  //   const result = await this.pool.query(
  //     `
  //       SELECT recovery_expiration FROM users
  //       WHERE recovery_code = $1
  //     `,
  //     [code],
  //   );

  //   if (result.rowCount === 0) {
  //     return null;
  //   }

  //   const { recovery_expiration: expiration } = result.rows[0];
  //   return { code, expiration };
  // }

  async getPasswordRecoveryInfo(code: string): Promise<PasswordRecoveryInfoType | null> {
    const user = await this.userEntityRepo.findOne({
      select: { passwordRecovery: true },
      where: { passwordRecovery: { code } },
    });

    if (!user) return null;

    return user.passwordRecovery;
  }

  // async createUser(
  //   login: string,
  //   email: string,
  //   hash: string,
  //   createdAt: Date,
  //   confirmation: ConfirmationInfoType,
  //   passwordRecovery: PasswordRecoveryInfoType,
  // ): Promise<UserViewType> {
  //   let id: number;
  //   const result = await this.pool.query(
  //     `
  //         INSERT INTO users (
  //           login,
  //           email,
  //           hash,
  //           created_at,
  //           is_confirmed,
  //           confirmation_code,
  //           confirmation_expiration,
  //           recovery_code,
  //           recovery_expiration
  //         )
  //         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  //         RETURNING id
  //       `,
  //     [
  //       login,
  //       email,
  //       hash,
  //       createdAt,
  //       confirmation.isConfirmed,
  //       confirmation.code,
  //       confirmation.expiration,
  //       passwordRecovery.code,
  //       passwordRecovery.expiration,
  //     ],
  //   );
  //   id = result.rows[0].id;

  //   return { id: id.toString(), login, email, createdAt: createdAt.toISOString() };
  // }

  async createUser(
    login: string,
    email: string,
    hash: string,
    createdAt: Date,
    confirmation: ConfirmationInfoType,
    passwordRecovery: PasswordRecoveryInfoType,
  ): Promise<UserViewType> {
    const confirmationEntity = new ConfirmationInfo();
    confirmationEntity.isConfirmed = confirmation.isConfirmed;
    confirmationEntity.code = confirmation.code!;
    confirmationEntity.expiration = confirmation.expiration!;

    const passwordRecoveryEntity = new PasswordRecoveryInfo();
    passwordRecoveryEntity.code = passwordRecovery.code!;
    passwordRecoveryEntity.expiration = passwordRecovery.expiration!;

    const user = this.userEntityRepo.create({
      login,
      email,
      hash,
      createdAt,
      confirmation: confirmationEntity,
      passwordRecovery: passwordRecoveryEntity,
    });

    const savedUser = await this.userEntityRepo.save(user);
    return savedUser.toViewType();
  }

  // async updateConfirmationCode(email: string, code: string, expiration: Date): Promise<void> {
  //   await this.pool.query(
  //     `
  //       UPDATE users
  //         SET confirmation_code = $2, confirmation_expiration = $3
  //         WHERE email = $1
  //     `,
  //     [email, code, expiration],
  //   );
  // }

  async updateConfirmationCode(email: string, code: string, expiration: Date): Promise<void> {
    await this.userEntityRepo.update(
      { email },
      {
        confirmation: {
          code,
          expiration,
        },
      },
    );
  }

  // async updateRecoveryCode(email: string, code: string, expiration: Date): Promise<boolean> {
  //   const updateResult = await this.pool.query(
  //     `
  //       UPDATE users
  //         SET recovery_code = $2, recovery_expiration = $3
  //         WHERE email = $1
  //     `,
  //     [email, code, expiration],
  //   );

  //   return updateResult.rowCount! > 0;
  // }

  async updateRecoveryCode(email: string, code: string, expiration: Date): Promise<boolean> {
    const updateResult = await this.userEntityRepo.update(
      { email },
      {
        passwordRecovery: {
          code,
          expiration,
        },
      },
    );

    return updateResult.affected! > 0;
  }

  // async updatePassword(recoveryCode: string, hash: string): Promise<void> {
  //   await this.pool.query(
  //     `
  //       UPDATE users
  //         SET hash = $2
  //         WHERE recovery_code = $1
  //     `,
  //     [recoveryCode, hash],
  //   );
  // }

  async updatePassword(recoveryCode: string, hash: string): Promise<void> {
    await this.userEntityRepo.update({ passwordRecovery: { code: recoveryCode } }, { hash });
  }

  // async confirmUser(code: string): Promise<void> {
  //   await this.pool.query(
  //     `
  //       UPDATE users
  //         SET is_confirmed = true, confirmation_expiration = NULL
  //         WHERE confirmation_code = $1
  //     `,
  //     [code],
  //   );
  // }

  async confirmUser(code: string): Promise<void> {
    await this.userEntityRepo.update(
      {
        confirmation: {
          code,
        },
      },
      { confirmation: { isConfirmed: true, expiration: undefined } }, // TypeOrm не разрешает присвоить null nullable полю
    );
  }

  // async deleteUser(id: string): Promise<boolean> {
  //   const idInt = Number.parseInt(id);

  //   const deleteResult = await this.pool.query(
  //     `
  //         DELETE FROM users
  //           WHERE id = $1
  //       `,
  //     [idInt],
  //   );

  //   return deleteResult.rowCount! > 0;
  // }

  async deleteUser(id: string): Promise<boolean> {
    const deleteResult = await this.userEntityRepo.softDelete({ id: Number.parseInt(id) });
    return deleteResult.affected! > 0;
  }
}
