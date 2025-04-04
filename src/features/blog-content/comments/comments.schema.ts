import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentatorInfoType } from './comments.types.js';

@Schema()
class CommentatorInfo {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userLogin: string;
}

const CommentatorInfoSchema = SchemaFactory.createForClass(CommentatorInfo);

@Schema({ versionKey: false })
export class Comment {
  @Prop({ required: true })
  postId: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: CommentatorInfoSchema,
    required: true,
  })
  commentatorInfo: CommentatorInfoType;

  @Prop({ required: true })
  createdAt: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
