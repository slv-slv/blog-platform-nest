import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export type LikesInfoViewType = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
};

export type ExtendedLikesInfoViewType = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: {
    addedAt: string;
    userId: string;
    login: string;
  }[];
};

export type LikeRecordType = {
  userId: string;
  createdAt: Date;
};

@Schema()
export class LikeRecord {
  @Prop({ required: true })
  userId: String;

  @Prop({ required: true })
  createdAt: Date;
}

export const LikeRecordSchema = SchemaFactory.createForClass(LikeRecord);
