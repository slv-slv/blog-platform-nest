import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigType } from '@nestjs/config';
import { EmailService } from './email/email.service.js';
import { emailConfig } from '../config/email.config.js';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [emailConfig.KEY],
      useFactory: (email: ConfigType<typeof emailConfig>) => ({
        transport: {
          host: email.smtpUrl,
          auth: { user: email.emailCredentials.user, pass: email.emailCredentials.password },
          port: 465,
          secure: true,
        },
        defaults: { from: '"Vyacheslav Solovev" <slvsl.spb@gmail.com>' },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
