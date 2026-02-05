import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentatorInfoType } from '../../types/comments.types.js';

@Schema({ _id: false })
class CommentatorInfo {
  @Prop({ required: true })
  declare userId: string;

  @Prop({ required: true })
  declare userLogin: string;
}

const CommentatorInfoSchema = SchemaFactory.createForClass(CommentatorInfo);

@Schema({ versionKey: false })
export class Comment {
  @Prop({ required: true })
  declare postId: string;

  @Prop({ required: true })
  declare content: string;

  @Prop({
    type: CommentatorInfoSchema,
    required: true,
  })
  declare commentatorInfo: CommentatorInfoType;

  @Prop({ required: true })
  declare createdAt: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
