import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { WithId } from 'mongodb';
import { BasicPagingParams } from '../../../common/types/paging-params.types.js';
import { Trim } from '../../../common/decorators/trim.js';

export type UserType = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

export enum UsersSortBy {
  login = 'login',
  email = 'email',
  createdAt = 'createdAt',
}

export type UserDbType = WithId<{
  login: string;
  email: string;
  hash: string;
  createdAt: string;
  confirmation: ConfirmationInfoType;
  passwordRecovery: PasswordRecoveryInfoType;
}>;

export type CurrentUserType = {
  email: string;
  login: string;
  userId: string;
};

export type UsersPaginatedType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserType[];
};

export type ConfirmationInfoType = {
  status: CONFIRMATION_STATUS;
  code: string | null;
  expiration: string | null;
};

export enum CONFIRMATION_STATUS {
  CONFIRMED = 'CONFIRMED',
  NOT_CONFIRMED = 'NOT_CONFIRMED',
}

export type PasswordRecoveryInfoType = {
  code: string | null;
  expiration: string | null;
};

export class EmailInputDto {
  @Trim()
  @IsEmail()
  email: string;
}

export class CreateUserInputDto {
  @IsString()
  @Trim()
  @Length(3, 10)
  @Matches('^[a-zA-Z0-9_-]*$')
  login: string;

  @IsString()
  @Trim()
  @Length(6, 20)
  password: string;

  @Trim()
  @IsEmail()
  email: string;
}

export class GetUsersQueryParams extends BasicPagingParams {
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
  loginOrEmail: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  password: string;
}

export class NewPasswordInputDto {
  @IsString()
  @Trim()
  @Length(6, 20)
  newPassword: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  recoveryCode: string;
}
