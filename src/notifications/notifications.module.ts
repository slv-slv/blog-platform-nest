import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email/email.service.js';
import { CoreConfig } from '../core/core.config.js';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => ({
        transport: {
          host: coreConfig.smtpUrl,
          auth: { user: coreConfig.emailCredentials.user, pass: coreConfig.emailCredentials.password },
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
