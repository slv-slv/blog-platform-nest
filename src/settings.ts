import dotenv from 'dotenv';
import { PagingParamsType } from './common/types/paging-params.types.js';

dotenv.config();

export const SETTINGS = {
  PORT: process.env.PORT || 3000,
  DB_NAME: 'blogs',
  DB_COLLECTIONS: {
    BLOGS: 'blogs',
    POSTS: 'posts',
    USERS: 'users',
    COMMENTS: 'comments',
    COMMENT_LIKES: 'commentLikes',
    POST_LIKES: 'postLikes',
    SESSIONS: 'sessions',
    RATE_LIMITER: 'rateLimiter',
  },
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/blog-platform',
  PAGING_DEFAULT_PARAMS: {
    sortBy: 'createdAt',
    sortDirection: 'desc',
    pageNumber: 1,
    pageSize: 10,
  } as PagingParamsType,
  CREDENTIALS: [{ login: 'admin', base64: 'YWRtaW46cXdlcnR5' }],
  EMAIL_CREDENTIALS: { user: process.env.EMAIL_LOGIN, password: process.env.EMAIL_PASSWORD },
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  ACCESS_TOKEN_LIFETIME: '10 s',
  REFRESH_TOKEN_LIFETIME: '20 s',
  CONFIRMATION_CODE_LIFETIME: 24,
  RECOVERY_CODE_LIFETIME: 24,
  NEWEST_LIKES_NUMBER: 3,
};
