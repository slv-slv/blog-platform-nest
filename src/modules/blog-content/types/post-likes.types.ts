import { WithId } from 'mongodb';

export type PostLikesModel = {
  postId: string;
  likes: { userId: string; createdAt: Date }[];
  dislikes: { userId: string; createdAt: Date }[];
};

export type PostLikeStatusRepoParams = {
  postId: string;
  userId: string | null;
};

export type SetPostLikeRepoParams = {
  postId: string;
  userId: string;
  createdAt: Date;
};

export type SetPostNoneRepoParams = {
  postId: string;
  userId: string;
};

// mongoose only
export type PostLikesDbType = WithId<PostLikesModel>;
