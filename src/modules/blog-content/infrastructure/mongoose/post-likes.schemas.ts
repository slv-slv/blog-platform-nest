import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeRecordSchema, LikeRecordType } from '../../types/likes.types.js';

@Schema({ versionKey: false })
export class PostLikes {
  @Prop({ required: true })
  declare postId: string;

  @Prop({ type: [LikeRecordSchema], required: true })
  declare likes: LikeRecordType[];

  @Prop({ type: [LikeRecordSchema], required: true })
  declare dislikes: LikeRecordType[];
}

export const PostLikesSchema = SchemaFactory.createForClass(PostLikes);
