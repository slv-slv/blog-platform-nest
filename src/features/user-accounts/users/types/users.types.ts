import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { WithId } from 'mongodb';
import { BasicPagingParams } from '../../../../common/types/paging-params.types.js';
import { Trim } from '../../../../common/decorators/trim.js';

export type UserType = {
  id: number;
  login: string;
  email: string;
  hash: string;
  createdAt: Date;
  confirmation: ConfirmationInfoType;
  passwordRecovery: PasswordRecoveryInfoType;
};

export type UserViewType = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

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

export enum UsersSortBy {
  login = 'login',
  email = 'email',
  createdAt = 'createdAt',
}

export type UsersPaginatedType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserViewType[];
};

export type ConfirmationInfoType = {
  isConfirmed: boolean;
  code: string | null;
  expiration: Date | null;
};

export type PasswordRecoveryInfoType = {
  code: string | null;
  expiration: Date | null;
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
