import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ConfirmationInfoType } from '../../types/users.types.js';

@Schema({ _id: false })
class ConfirmationInfo {
  @Prop({ required: true })
  declare isConfirmed: boolean;

  @Prop({ default: null })
  declare code: string;

  @Prop({ default: null })
  declare expiration: Date;
}

const ConfirmationInfoSchema = SchemaFactory.createForClass(ConfirmationInfo);

@Schema({ _id: false })
class PasswordRecoveryInfo {
  @Prop({ default: null })
  declare code: string;

  @Prop({ default: null })
  declare expiration: Date;
}

const PasswordRecoveryInfoSchema = SchemaFactory.createForClass(PasswordRecoveryInfo);

@Schema({ versionKey: false })
export class User {
  @Prop({ required: true })
  declare login: string;

  @Prop({ required: true })
  declare email: string;

  @Prop({ required: true })
  declare hash: string;

  @Prop({ required: true })
  declare createdAt: Date;

  @Prop({ type: ConfirmationInfoSchema, required: true })
  declare confirmation: ConfirmationInfoType;

  @Prop({ type: PasswordRecoveryInfoSchema, required: true })
  declare passwordRecovery: PasswordRecoveryInfo;
}

export const UserSchema = SchemaFactory.createForClass(User);
