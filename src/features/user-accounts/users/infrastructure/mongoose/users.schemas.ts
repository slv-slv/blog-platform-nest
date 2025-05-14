import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CONFIRMATION_STATUS, ConfirmationInfoType } from '../../users.types.js';

@Schema({ _id: false })
class ConfirmationInfo {
  @Prop({ type: String, enum: Object.values(CONFIRMATION_STATUS), required: true })
  status: CONFIRMATION_STATUS;

  @Prop({ default: null })
  code: string;

  @Prop({ default: null })
  expiration: string;
}

const ConfirmationInfoSchema = SchemaFactory.createForClass(ConfirmationInfo);

@Schema({ _id: false })
class PasswordRecoveryInfo {
  @Prop({ default: null })
  code: string;

  @Prop({ default: null })
  expiration: string;
}

const PasswordRecoveryInfoSchema = SchemaFactory.createForClass(PasswordRecoveryInfo);

@Schema({ versionKey: false })
export class User {
  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ type: ConfirmationInfoSchema, required: true })
  confirmation: ConfirmationInfoType;

  @Prop({ type: PasswordRecoveryInfoSchema, required: true })
  passwordRecovery: PasswordRecoveryInfo;
}

export const UserSchema = SchemaFactory.createForClass(User);
