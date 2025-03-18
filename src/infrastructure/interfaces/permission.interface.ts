import { HttpMethod } from '@common/index';

export interface Permission {
  action: HttpMethod;
  subject: string;
  fields: string[];
}
