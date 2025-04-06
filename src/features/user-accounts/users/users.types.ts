import { IsEmail, Length, Matches } from 'class-validator';
import { WithId } from 'mongodb';

export class CreateUserInputDto {
  @Length(3, 10)
  @Matches('^[a-zA-Z0-9_-]*$')
  login: string;

  @Length(6, 20)
  password: string;

  @IsEmail()
  email: string;
}

export type UserType = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

export enum UserSortedByKeys {
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
