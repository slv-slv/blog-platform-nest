import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ConfirmationInfo, PasswordRecoveryInfo } from './users.types.js';

@Schema()
export class User {
  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  confirmation: ConfirmationInfo;

  @Prop({ required: true })
  passwordRecovery: PasswordRecoveryInfo;
}

export const UserSchema = SchemaFactory.createForClass(User);
