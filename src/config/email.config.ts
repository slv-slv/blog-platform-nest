import { registerAs } from '@nestjs/config';
import { plainToInstance, Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { validateOrThrow } from './validate-or-throw.js';

class EmailCredentials {
  @IsString()
  @IsNotEmpty()
  declare user: string;

  @IsString()
  @IsNotEmpty()
  declare password: string;
}

class EmailConfig {
  @ValidateNested()
  @Type(() => EmailCredentials)
  @IsDefined()
  declare emailCredentials: EmailCredentials;

  @IsString()
  @IsNotEmpty()
  declare smtpUrl: string;
}

export const emailConfig = registerAs('email', () => {
  const emailConfigEnvInput = {
    emailCredentials: {
      user: process.env.EMAIL_LOGIN_GOOGLE,
      password: process.env.EMAIL_PASSWORD_GOOGLE,
    },
    smtpUrl: process.env.SMTP_URL,
  };

  const emailConfigEnv = plainToInstance(EmailConfig, emailConfigEnvInput);
  return validateOrThrow(emailConfigEnv, 'email config');
});
