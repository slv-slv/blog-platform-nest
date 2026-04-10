import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { WithId } from 'mongodb';
import { Trim } from '../../../common/decorators/trim.js';
import { BasicPagingParams, PagingParamsType } from '../../../common/types/paging-params.types.js';

export type UserModel = {
  id: string;
  login: string;
  email: string;
  hash: string;
  createdAt: Date;
  confirmation: ConfirmationInfoModel;
  passwordRecovery: PasswordRecoveryInfoModel;
};

export type UserViewModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

export type UserDbType = WithId<{
  login: string;
  email: string;
  hash: string;
  createdAt: Date;
  confirmation: ConfirmationInfoModel;
  passwordRecovery: PasswordRecoveryInfoModel;
}>;

export type CurrentUserViewModel = {
  email: string;
  login: string;
  userId: string;
};

export enum UsersSortBy {
  login = 'login',
  email = 'email',
  createdAt = 'createdAt',
}

export type UsersPaginatedViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserViewModel[];
};

export type ConfirmationInfoModel = {
  isConfirmed: boolean;
  code: string | null;
  expiration: Date | null;
};

export type PasswordRecoveryInfoModel = {
  code: string | null;
  expiration: Date | null;
};

export class EmailInputDto {
  @Trim()
  @IsEmail()
  declare email: string;
}

export class CreateUserInputDto {
  @IsString()
  @Trim()
  @Length(3, 10)
  @Matches('^[a-zA-Z0-9_-]*$')
  declare login: string;

  @IsString()
  @Trim()
  @Length(6, 20)
  declare password: string;

  @Trim()
  @IsEmail()
  declare email: string;
}

export class GetUsersQueryDto extends BasicPagingParams {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  searchLoginTerm: string | null = null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  searchEmailTerm: string | null = null;

  @IsOptional()
  @IsEnum(UsersSortBy)
  sortBy: UsersSortBy = UsersSortBy.createdAt;
}

export class LoginInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  declare loginOrEmail: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  declare password: string;
}

export class NewPasswordInputDto {
  @IsString()
  @Trim()
  @Length(6, 20)
  declare newPassword: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  declare recoveryCode: string;
}

export type GetUsersParams = {
  searchLoginTerm: string | null;
  searchEmailTerm: string | null;
  pagingParams: PagingParamsType;
};

export type CreateUserParams = {
  login: string;
  email: string;
  password: string;
  confirmation?: ConfirmationInfoModel;
  passwordRecovery?: PasswordRecoveryInfoModel;
};

export type RegisterUserParams = {
  login: string;
  email: string;
  password: string;
};

export type CreateUserRepoParams = {
  login: string;
  email: string;
  hash: string;
  createdAt: Date;
  confirmation: ConfirmationInfoModel;
  passwordRecovery: PasswordRecoveryInfoModel;
};

export type UpdateConfirmationCodeParams = {
  email: string;
  code: string;
  expiration: Date;
};

export type UpdateRecoveryCodeParams = {
  email: string;
  code: string;
  expiration: Date;
};
