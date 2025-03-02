import { messages } from "@common/constants";
import { BadRequestException } from "@common/exceptions";
import { logger } from "@infrastructure/config";
import sendGrid from "@sendgrid/mail";
import { MailData, MailDataRequired } from "@sendgrid/helpers/classes/mail";
import { ServiceBase } from "@common/index";

class MailService extends ServiceBase {
  private apiKey: string | null = null;
  private senderEmail: string | null = null;
  private client: typeof sendGrid | null = null;
  private prepareMailData(data: Partial<MailData>): MailDataRequired {
    if (!data.from && this.senderEmail) data.from = this.senderEmail;

    return data as MailDataRequired;
  }

  constructor() {
    super(MailService.name);
  }

  public async configure(apiKey: string, defaultSender: string): Promise<void> {
    this.apiKey = apiKey;
    this.senderEmail = defaultSender;

    sendGrid.setApiKey(this.apiKey);
    this.client = sendGrid;
    logger.info(messages.service.configured(MailService.name));
  }

  public isConfigured(): boolean {
    return !!this.client && !!this.apiKey && !!this.senderEmail;
  }

  public async send(mailData: Partial<MailData>): Promise<boolean> {
    if (!this.isConfigured) {
      logger.error(messages.service.notConfigured(typeof MailService));
      throw new BadRequestException();
    }

    const preparedData = this.prepareMailData(mailData);

    await this.client!.send(preparedData);

    return true;
  }
}

export const mailService = MailService.getInstance();
