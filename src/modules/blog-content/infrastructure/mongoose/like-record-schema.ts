import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type LikeRecordModel = {
  userId: string;
  createdAt: Date;
};

@Schema({ _id: false })
export class LikeRecord {
  @Prop({ required: true, type: String })
  declare userId: string;

  @Prop({ required: true, type: Date })
  declare createdAt: Date;
}

export const LikeRecordSchema = SchemaFactory.createForClass(LikeRecord);
