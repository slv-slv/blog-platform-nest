import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.schemas.js';
import { Model } from 'mongoose';
import {
  CurrentUserType,
  GetAllUsersParams,
  UsersPaginatedType,
  UserViewType,
} from '../../types/users.types.js';
import { ObjectId } from 'mongodb';
import {
  UnauthorizedDomainException,
  UserNotFoundDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  async getUsers(params: GetAllUsersParams): Promise<UsersPaginatedType> {
    const { searchLoginTerm, searchEmailTerm, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    let filter = {};
    const loginFilter = searchLoginTerm ? { login: { $regex: searchLoginTerm, $options: 'i' } } : {};
    const emailFilter = searchEmailTerm ? { email: { $regex: searchEmailTerm, $options: 'i' } } : {};

    if (searchEmailTerm && searchLoginTerm) {
      filter = { $or: [loginFilter, emailFilter] };
    } else if (searchEmailTerm) {
      filter = emailFilter;
    } else if (searchLoginTerm) {
      filter = loginFilter;
    }

    const totalCount = await this.model.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / pageSize);

    const usersWithObjectId = await this.model
      .find(filter, { hash: 0 })
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const users = usersWithObjectId.map((user) => {
      return {
        id: user._id.toString(),
        login: user.login,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      };
    });

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: users,
    };
  }

  async findUser(loginOrEmail: string): Promise<UserViewType> {
    const filter = loginOrEmail.includes('@') ? { email: loginOrEmail } : { login: loginOrEmail };
    const user = await this.model.findOne(filter, { hash: 0 }).lean();
    if (!user) {
      throw new UserNotFoundDomainException();
    }
    const { _id, login, email, createdAt } = user;
    const id = _id.toString();
    return { id, login, email, createdAt: createdAt.toISOString() };
  }

  async getCurrentUser(userId: string): Promise<CurrentUserType> {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedDomainException('User not found');
    }

    const _id = new ObjectId(userId);
    const user = await this.model.findOne({ _id }, { email: 1, login: 1 }).lean();
    if (!user) {
      throw new UnauthorizedDomainException('User not found');
    }
    const { email, login } = user;
    return { email, login, userId };
  }

  async getUserLoginsMap(userIdArr: string[]): Promise<Map<string, string>> {
    const uniqueUserIds = [...new Set(userIdArr)].filter((userId) => ObjectId.isValid(userId));
    if (uniqueUserIds.length === 0) {
      return new Map();
    }

    const objectIds = uniqueUserIds.map((userId) => new ObjectId(userId));
    const users = await this.model.find({ _id: { $in: objectIds } }, { login: 1 }).lean();

    return new Map(users.map((user) => [user._id.toString(), user.login]));
  }
}
