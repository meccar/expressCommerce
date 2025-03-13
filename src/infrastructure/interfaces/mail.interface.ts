export interface MailOptions {
  to: string | string[];
  subject: string;
  content: string;
  isHtml?: boolean;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}
