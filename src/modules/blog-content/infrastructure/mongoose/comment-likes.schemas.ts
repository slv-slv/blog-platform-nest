import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeRecordSchema, LikeRecordType } from './like-record-schema.js';

@Schema({ versionKey: false })
export class CommentLikes {
  @Prop({ required: true })
  declare commentId: string;

  @Prop({ type: [LikeRecordSchema], required: true })
  declare likes: LikeRecordType[];

  @Prop({ type: [LikeRecordSchema], required: true })
  declare dislikes: LikeRecordType[];
}

export const CommentLikesSchema = SchemaFactory.createForClass(CommentLikes);
