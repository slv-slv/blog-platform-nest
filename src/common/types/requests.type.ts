import { Request } from 'express';
import { UserModel } from '../../modules/user-accounts/types/users.types.js';

export type RequestWithOptionalUserId = Request & {
  userId: string | null;
};

export type RequestWithUserId = Request & {
  userId: string;
};

export type RequestWithUser = Request & {
  user: UserModel;
};

export type RequestWithSession = Request & {
  userId: string;
  deviceId: string;
};
