import { registerAs } from '@nestjs/config';
import { plainToInstance, Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { validateOrThrow } from './validate-or-throw.js';

class EmailCredentialsSchema {
  @IsString()
  @IsNotEmpty()
  declare user: string;

  @IsString()
  @IsNotEmpty()
  declare password: string;
}

class EmailConfigSchema {
  @ValidateNested()
  @Type(() => EmailCredentialsSchema)
  @IsDefined()
  declare emailCredentials: EmailCredentialsSchema;

  @IsString()
  @IsNotEmpty()
  declare smtpUrl: string;
}

export const emailconfig = registerAs('email', () => {
  const emailConfigEnvInput = {
    emailCredentials: {
      user: process.env.EMAIL_LOGIN_GOOGLE,
      password: process.env.EMAIL_PASSWORD_GOOGLE,
    },
    smtpUrl: process.env.SMTP_URL,
  };

  const emailConfigEnv = plainToInstance(EmailConfigSchema, emailConfigEnvInput);
  return validateOrThrow(emailConfigEnv, 'email config');
});
