import { Request } from 'express';
import { UserViewModel } from '../../modules/user-accounts/types/users.types.js';

export type RequestWithOptionalUserId = Request & {
  userId: string | null;
};

export type RequestWithUserId = Request & {
  userId: string;
};

export type RequestWithUser = Request & {
  user: UserViewModel;
};

export type RequestWithSession = Request & {
  userId: string;
  deviceId: string;
};
