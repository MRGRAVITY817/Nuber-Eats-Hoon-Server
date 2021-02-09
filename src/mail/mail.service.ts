import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(
    subject: string,
    template: string,
    emailVar: EmailVar[],
  ): Promise<boolean> {
    try {
      const form = new FormData();
      form.append('from', `Excited User <mailgun@${this.options.domain}>`);
      form.append('to', `mrgravity817@gmail.com`);
      form.append('subject', subject);
      // Mailgun will look for this template
      form.append('template', template);
      emailVar.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));
      const response = await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          https: {
            rejectUnauthorized: false,
          },
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
