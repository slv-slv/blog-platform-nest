import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeRecordSchema, LikeRecordModel } from './like-record-schema.js';

@Schema({ versionKey: false })
export class CommentReactions {
  @Prop({ required: true })
  declare commentId: string;

  @Prop({ type: [LikeRecordSchema], required: true })
  declare likes: LikeRecordModel[];

  @Prop({ type: [LikeRecordSchema], required: true })
  declare dislikes: LikeRecordModel[];
}

export const CommentReactionsSchema = SchemaFactory.createForClass(CommentReactions);
