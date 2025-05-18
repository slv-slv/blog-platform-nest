import nodemailer from 'nodemailer';
import { SETTINGS } from '../../settings.js';

export const emailTransport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  // host: 'smtp.yandex.ru',
  port: 465,
  secure: true,
  auth: {
    user: SETTINGS.EMAIL_CREDENTIALS.user,
    pass: SETTINGS.EMAIL_CREDENTIALS.password,
  },
});
