import { messages } from '@common/constants';
import { BadRequestException } from '@common/exceptions';
import { logger } from '@infrastructure/config';
import { ServiceBase } from '@common/index';
import Email from 'email-templates';
import path from 'path';

class MailService extends ServiceBase {
  private emailClient: Email | null = null;
  private senderEmail: string | null = null;
  private templatesDir: string = path.join(__dirname, 'templates');

  constructor() {
    super(MailService.name);
  }

  public async configure(
    host: string,
    port: number,
    user: string,
    pass: string,
    sender: string,
  ): Promise<void> {
    this.emailClient = new Email({
      message: {
        from: sender,
      },
      transport: {
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      },
      views: {
        root: this.templatesDir,
        options: {
          extension: 'hbs',
        },
      },
      send: true,
      preview: process.env.NODE_ENV !== 'production',
      juice: true,
      juiceResources: {
        preserveImportant: true,
      },
    });

    this.senderEmail = sender;

    logger.info(messages.service.configured(MailService.name));
  }

  public isConfigured(): boolean {
    return !!this.emailClient && !!this.senderEmail;
  }

  public async send(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any> = {},
  ): Promise<boolean> {
    if (!this.isConfigured) {
      logger.error(messages.service.notConfigured(typeof MailService));
      throw new BadRequestException();
    }

    await this.emailClient!.send({
      template: template,
      message: {
        to,
        subject,
      },
      locals: context,
    });

    return true;
  }
}

export const mailService = MailService.getInstance();
