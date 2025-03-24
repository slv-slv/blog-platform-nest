import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentatorInfo } from './comment.types.js';
import mongoose from 'mongoose';

@Schema()
export class Comment {
  @Prop({ required: true })
  postId: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    required: true,
    type: {
      userId: { type: String, required: true },
      userLogin: { type: String, required: true },
    },
  })
  commentatorInfo: CommentatorInfo;

  @Prop({ required: true })
  createdAt: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
