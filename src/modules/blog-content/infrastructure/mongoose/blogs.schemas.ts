// import { Prop, Schema } from '@nestjs/mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class Blog {
  @Prop({ required: true })
  declare name: string;

  @Prop({ required: true })
  declare description: string;

  @Prop({ required: true })
  declare websiteUrl: string;

  @Prop({ required: true })
  declare createdAt: string;

  @Prop({ required: true })
  declare isMembership: boolean;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
