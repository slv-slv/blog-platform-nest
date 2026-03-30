import { Injectable } from '@nestjs/common';
import {
  CurrentUserViewModel,
  GetUsersParams,
  UsersPaginatedViewModel,
} from '../../types/users.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entities.js';
import { ILike, Repository } from 'typeorm';
import { UnauthorizedDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectRepository(User) private readonly userEntityRepository: Repository<User>) {}

  async getUsers(params: GetUsersParams): Promise<UsersPaginatedViewModel> {
    const { searchLoginTerm, searchEmailTerm, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const whereParams = [];

    if (searchLoginTerm) {
      whereParams.push({ login: ILike(`%${searchLoginTerm}%`) });
    }

    if (searchEmailTerm) {
      whereParams.push({ email: ILike(`%${searchEmailTerm}%`) });
    }

    const [users, totalCount] = await this.userEntityRepository.findAndCount({
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
      items: users.map((user) => user.toViewModel()),
    };
  }

  async getCurrentUser(userId: string): Promise<CurrentUserViewModel> {
    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException('User not found');
    }

    const user = await this.userEntityRepository.findOne({
      select: ['id', 'login', 'email'],
      where: { id: +userId },
    });

    if (!user) {
      throw new UnauthorizedDomainException('User not found');
    }

    return user.toCurrentUserViewModel();
  }
}
