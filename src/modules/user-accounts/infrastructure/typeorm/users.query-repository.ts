import { Inject, Injectable } from '@nestjs/common';
import {
  CurrentUserViewModel,
  GetUsersParams,
  UsersPaginatedViewModel,
  UserViewModel,
} from '../../types/users.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entities.js';
import { ILike, Like, Repository } from 'typeorm';
import {
  UnauthorizedDomainException,
  UserNotFoundDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';

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

  async findUser(loginOrEmail: string): Promise<UserViewModel> {
    const likeTerm = `%${loginOrEmail}%`;

    const user = await this.userEntityRepository.findOne({
      select: ['id', 'login', 'email', 'createdAt'],
      where: [{ login: Like(likeTerm) }, { email: Like(likeTerm) }],
    });

    if (!user) {
      throw new UserNotFoundDomainException();
    }

    return user.toViewModel();
  }

  async getCurrentUser(userId: string): Promise<CurrentUserViewModel> {
    const user = await this.userEntityRepository.findOne({
      select: ['id', 'login', 'email'],
      where: { id: Number.parseInt(userId) },
    });

    if (!user) {
      throw new UnauthorizedDomainException('User not found');
    }

    return user.toCurrentUserViewModel();
  }
}
