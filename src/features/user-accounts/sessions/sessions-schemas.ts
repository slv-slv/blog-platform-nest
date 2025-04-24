import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

export type DeviceType = {
  id: string;
  name: string;
  ip: string;
  iat: number;
  exp: number;
};

@Schema({ _id: false })
export class Device {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  ip: string;

  @Prop({ required: true })
  iat: number;

  @Prop({ required: true })
  exp: number;
}

const DeviceSchema = SchemaFactory.createForClass(Device);

@Schema({ versionKey: false })
export class Session {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: DeviceSchema, required: true })
  devices: DeviceType[];
}

export const SessionSchema = SchemaFactory.createForClass(Session);
