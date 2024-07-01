/* eslint-disable @typescript-eslint/consistent-type-definitions */

export type SMTP_Config = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
};

export type Email = {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
};
