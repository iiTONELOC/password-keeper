import {logger} from 'passwordkeeper.logger';
import nodemailer, {Transporter} from 'nodemailer';
import {SMTP_Config, Email} from 'passwordkeeper.types';

export const smtpConfig: SMTP_Config = {
  host: process.env.EMAIL_HOST as string,
  port: parseInt(process.env.EMAIL_PORT as string),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER as string,
    pass: process.env.EMAIL_PASS as string
  }
};

export const createTransporter = (): Transporter =>
  nodemailer.createTransport(smtpConfig, {
    debug: true,
    logger: true
  });

// validateField checks if a field is missing or has the wrong type
export const validateField = (
  field: unknown,
  fieldName: string,
  fieldType: string,
  errors: string[]
): void => {
  if (!field) {
    errors.push(`missing ${fieldName}`);
  } else if (typeof field !== fieldType) {
    errors.push(`${fieldName} is not a ${fieldType}`);
  }
};

// validateStringField checks if a string field is missing or has the wrong type
export const validateStringField = (field: unknown, fieldName: string, errors: string[]): void =>
  validateField(field, fieldName, 'string', errors);

// validateEmail checks if an email is missing required fields or has invalid field types
export const validateEmail = (email: Email): [boolean, string] => {
  const errors: string[] = [];

  validateField(email.from, 'from', 'string', errors);
  validateField(email.to, 'to', 'string', errors);
  validateField(email.subject, 'subject', 'string', errors);

  if (!email.text && !email.html) {
    errors.push('missing text or html');
  } else {
    email.text && validateStringField(email.text, 'text', errors);
    email.html && validateStringField(email.html, 'html', errors);
  }

  if (errors.length > 0) {
    logger.error('validateEmail:: Email is missing required fields or has invalid field types');
    return [false, errors.join(', ')];
  }

  return [true, ''];
};

// sendEmail sends an email using the provided email object
export const sendEmail = async (email: Email): Promise<boolean> => {
  // validate the email to ensure it has a from, to, subject, and at least one of text or html
  const [isValid, error] = validateEmail(email);
  if (!isValid) {
    throw new Error('Email is not valid: ' + error);
  }
  try {
    const transporter = createTransporter();
    const transportResult = await transporter.sendMail(email);
    console.log('Email sent: \n', transportResult);
    return true;
  } catch (error) {
    console.error(error);
    logger.error(`sendEmail:: Error sending email: ${error}`);
    return false;
  }
};
