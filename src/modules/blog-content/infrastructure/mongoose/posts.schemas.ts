import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class Post {
  @Prop({ required: true })
  declare title: string;

  @Prop({ required: true })
  declare shortDescription: string;

  @Prop({ required: true })
  declare content: string;

  @Prop({ required: true })
  declare blogId: string;

  @Prop({ required: true })
  declare blogName: string;

  @Prop({ required: true })
  declare createdAt: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
