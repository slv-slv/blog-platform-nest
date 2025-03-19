// import { Prop, Schema } from '@nestjs/mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BlogDbType } from './blogs.types.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const blogSchema = new Schema<BlogDbType>(
//   {
//     name: { type: String, required: true },
//     description: { type: String, required: true },
//     websiteUrl: { type: String, required: true },
//     createdAt: { type: String, required: true },
//     isMembership: { type: Boolean, required: true },
//   },
//   { versionKey: false },
// );

@Schema()
export class Blog {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  websiteUrl!: string;

  @Prop({ required: true })
  createdAt!: string;

  @Prop({ required: true })
  isMembership!: boolean;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
