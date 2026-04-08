import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeRecordSchema, LikeRecordModel } from './like-record-schema.js';

@Schema({ versionKey: false })
export class PostReactions {
  @Prop({ required: true })
  declare postId: string;

  @Prop({ type: [LikeRecordSchema], required: true })
  declare likes: LikeRecordModel[];

  @Prop({ type: [LikeRecordSchema], required: true })
  declare dislikes: LikeRecordModel[];
}

export const PostReactionsSchema = SchemaFactory.createForClass(PostReactions);
