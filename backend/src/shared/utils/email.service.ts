import nodemailer from 'nodemailer';
import { logger } from '../logger/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    try {
      const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
      const port = Number(process.env.SMTP_PORT) || 587;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (user && pass) {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        logger.info(`Email service initialized with SMTP host: ${host}`);
      } else {
        // Fallback test account transporter or logger
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'ethereal_user',
            pass: 'ethereal_pass',
          },
        });
        logger.info('Email service initialized in simulation mode (Ethereal test host)');
      }
    } catch (err: any) {
      logger.warn(`Could not initialize SMTP transporter: ${err.message}`);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const from = process.env.SMTP_FROM || 'no-reply@peoplepay360.com';
      if (!this.transporter) {
        logger.info({ to: options.to, subject: options.subject }, 'Email simulation: Transporter offline');
        return true;
      }

      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      logger.info({ to: options.to, subject: options.subject }, 'Email sent successfully');
      return true;
    } catch (err: any) {
      logger.error({ err: err.message, to: options.to }, 'Failed to send email notification');
      return false;
    }
  }

  async sendPayslipEmail(employeeEmail: string, employeeName: string, periodStr: string, pdfBuffer: Buffer): Promise<boolean> {
    const subject = `Your PeoplePay360 Payslip for ${periodStr}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Hello ${employeeName},</h2>
        <p>Your official payslip for <strong>${periodStr}</strong> has been generated and finalized.</p>
        <p>Please find attached your payslip PDF.</p>
        <br/>
        <p>Best regards,<br/><strong>PeoplePay360 Payroll Department</strong></p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject,
      html,
      attachments: [
        {
          filename: `payslip-${periodStr.replace('/', '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}

export const emailService = new EmailService();
