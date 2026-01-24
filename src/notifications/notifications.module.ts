import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email/email.service.js';
import { SETTINGS } from '../settings.js';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: SETTINGS.SMTP_SERVER,
        auth: { user: SETTINGS.EMAIL_CREDENTIALS.user, pass: SETTINGS.EMAIL_CREDENTIALS.password },
        port: 465,
        secure: true,
      },
      defaults: { from: '"Vyacheslav Solovev" <slvsl.spb@gmail.com>' },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
