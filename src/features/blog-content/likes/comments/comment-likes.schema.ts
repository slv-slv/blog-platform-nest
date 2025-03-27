import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeRecordSchema, LikeRecordType } from '../types/likes.types.js';

@Schema({ versionKey: false })
export class CommentLikes {
  @Prop({ required: true })
  commentId: string;

  @Prop({ type: [LikeRecordSchema], required: true })
  likes: LikeRecordType[];

  @Prop({ type: [LikeRecordSchema], required: true })
  dislikes: LikeRecordType[];
}

export const CommentLikesSchema = SchemaFactory.createForClass(CommentLikes);
