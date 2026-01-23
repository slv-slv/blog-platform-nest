import { Inject, Injectable } from '@nestjs/common';
import { PagingParamsType } from '../../../../common/types/paging-params.types.js';
import {
  ConfirmationInfoType,
  CurrentUserType,
  PasswordRecoveryInfoType,
  UsersPaginatedType,
  UserViewType,
} from '../../types/users.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entities.js';
import { ILike, Like, Repository } from 'typeorm';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectRepository(User) private readonly userEntityRepo: Repository<User>) {}

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

  async findUser(loginOrEmail: string): Promise<UserViewType | null> {
    const likeTerm = `%${loginOrEmail}%`;

    const user = await this.userEntityRepo.findOne({
      select: ['id', 'login', 'email', 'createdAt'],
      where: [{ login: Like(likeTerm) }, { email: Like(likeTerm) }],
    });

    if (!user) return null;

    return user.toViewType();
  }

  async getCurrentUser(userId: string): Promise<CurrentUserType | null> {
    const user = await this.userEntityRepo.findOne({
      select: ['id', 'login', 'email'],
      where: { id: Number.parseInt(userId) },
    });

    if (!user) return null;

    return user.toCurrentUserType();
  }

  async isConfirmed(loginOrEmail: string): Promise<boolean> {
    // Проверка существования пользователя выполняется в сервисе или middleware
    return await this.userEntityRepo.existsBy([
      { confirmation: { isConfirmed: true }, login: loginOrEmail },
      { confirmation: { isConfirmed: true }, email: loginOrEmail },
    ]);
  }

  async isLoginExists(login: string): Promise<boolean> {
    return await this.userEntityRepo.existsBy({ login });
  }

  async isEmailExists(email: string): Promise<boolean> {
    return await this.userEntityRepo.existsBy({ email });
  }

  async getPasswordHash(loginOrEmail: string): Promise<string | null> {
    const user = await this.userEntityRepo.findOne({
      select: { hash: true },
      where: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });

    if (!user) return null;

    return user.hash;
  }
}
