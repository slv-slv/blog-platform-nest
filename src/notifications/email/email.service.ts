import { Injectable } from '@nestjs/common';
import { emailTransport } from './nodemailer.js';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendConfirmationCode(to: string, code: string): Promise<void> {
    try {
      const url = new URL('/auth/registration-confirmation', 'https://nightingale.com/');
      url.searchParams.set('code', code);

      const info = await this.mailerService.sendMail({
        // from: '"Vyacheslav Solovev" <xnightingale@yandex.ru>',
        from: '"Vyacheslav Solovev" <slvsl.spb@gmail.com>',
        to,
        subject: 'Confirm your email',
        text: `Thank you for your registration. To confirm your profile please follow the link below:\n${url.href}`,
        html: `<h1>Thank you for your registration</h1><p>To confirm your profile please follow the link below:</p><a href='${url.href}'>Complete registration</a>`,
      });

      console.log(info);
    } catch (e) {
      console.error(e);
    }
  }

  async sendRecoveryCode(to: string, code: string): Promise<void> {
    try {
      const url = new URL('/auth/password-recovery', 'https://nightingale.com/');
      url.searchParams.set('recoveryCode', code);

      const info = await this.mailerService.sendMail({
        // from: '"Vyacheslav Solovev" <xnightingale@yandex.ru>',
        from: '"Vyacheslav Solovev" <slvsl.spb@gmail.com>',
        to,
        subject: 'Password recovery',
        text: `To reset your password please follow the link below:\n${url.href}`,
        html: `<h1>Password recovery</h1><p>To reset your password please follow the link below:</p><a href='${url.href}'>Reset password</a>`,
      });

      console.log(info);
    } catch (e) {
      console.error(e);
    }
  }
}
