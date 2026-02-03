import { registerAs } from '@nestjs/config';

export const emailconfig = registerAs('email', () => ({
  emailCredentials: { user: process.env.EMAIL_LOGIN_GOOGLE, password: process.env.EMAIL_PASSWORD_GOOGLE },
  smtpUrl: process.env.SMTP_URL,
}));
