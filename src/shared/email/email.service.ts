import { Resend } from 'resend';
import { env } from '../../config/env';
import { forgotPasswordTemplate } from './templates/forgotPassword';

export class EmailService {
  private resend = new Resend(env.RESEND_API_KEY);

  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ) {
    return this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
  }

  async sendForgotPasswordEmail(
    email: string,
    resetUrl: string,
  ) {
    return this.sendEmail(
      email,
      'Reset Password',
      forgotPasswordTemplate(resetUrl),
    );
  }
}

export const emailService = new EmailService();
