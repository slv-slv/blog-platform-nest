import { Request } from 'express';
import { UserViewType } from '../../modules/user-accounts/types/users.types.js';

export type RequestWithOptionalUserId = Request & {
  userId: string | null;
};

export type RequestWithUserId = Request & {
  userId: string;
};

export type RequestWithUser = Request & {
  user: UserViewType;
};

export type RequestWithSession = Request & {
  userId: string;
  deviceId: string;
  jti: string;
};
