import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email/email.service.js';
import { EmailConfig } from '../core/core.config.js';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [EmailConfig],
      useFactory: (emailConfig: EmailConfig) => ({
        transport: {
          host: emailConfig.smtpUrl,
          auth: { user: emailConfig.emailCredentials.user, pass: emailConfig.emailCredentials.password },
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
