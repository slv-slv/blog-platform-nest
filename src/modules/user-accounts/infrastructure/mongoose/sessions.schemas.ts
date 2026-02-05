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
  declare id: string;

  @Prop({ required: true })
  declare name: string;

  @Prop({ required: true })
  declare ip: string;

  @Prop({ required: true })
  declare iat: number;

  @Prop({ required: true })
  declare exp: number;
}

const DeviceSchema = SchemaFactory.createForClass(Device);

@Schema({ versionKey: false })
export class Session {
  @Prop({ required: true })
  declare userId: string;

  @Prop({ type: [DeviceSchema], required: true })
  declare devices: DeviceType[];
}

export const SessionSchema = SchemaFactory.createForClass(Session);
