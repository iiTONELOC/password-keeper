import {Email} from 'passwordkeeper.types';
import {describe, expect, it} from '@jest/globals';
import {
  sendEmail,
  smtpConfig,
  validateEmail,
  validateField,
  createTransporter,
  validateStringField
} from './sendEmail';

describe('Email Module', () => {
  const testEmail: Email = {
    from: process.env.EMAIL_SENDER as string,
    to: process.env.TEST_EMAIL_USER as string,
    subject: 'Test Email',
    text: 'This is a test email'
  };

  describe('validate field', () => {
    it('should add missing field to errors', () => {
      const errors: string[] = [];
      validateField(undefined, 'test', 'string', errors);

      expect(errors).toEqual(['missing test']);
      expect.assertions(1);
    });

    it('should add invalid field type to errors', () => {
      const errors: string[] = [];
      validateField(1, 'test', 'string', errors);

      expect(errors).toEqual(['test is not a string']);
      expect.assertions(1);
    });

    it('should not add anything to errors', () => {
      const errors: string[] = [];
      validateField('test', 'test', 'string', errors);

      expect(errors).toEqual([]);
      expect.assertions(1);
    });
  });

  describe('validate string field', () => {
    it('should add missing field to errors', () => {
      const errors: string[] = [];
      validateStringField(undefined, 'test', errors);

      expect(errors).toEqual(['missing test']);
      expect.assertions(1);
    });

    it('should add invalid field type to errors', () => {
      const errors: string[] = [];
      validateStringField(1, 'test', errors);

      expect(errors).toEqual(['test is not a string']);
      expect.assertions(1);
    });

    it('should not add anything to errors', () => {
      const errors: string[] = [];
      validateStringField('test', 'test', errors);

      expect(errors).toEqual([]);
      expect.assertions(1);
    });
  });

  describe('validate email', () => {
    it('should return true if email is valid', () => {
      const [valid, errors] = validateEmail(testEmail);

      expect(valid).toBe(true);
      expect(errors).toBe('');
      expect.assertions(2);
    });

    it('should return false if email is missing required fields', () => {
      const [valid, errors] = validateEmail({} as Email);

      expect(valid).toBe(false);
      expect(errors).toBe('missing from, missing to, missing subject, missing text or html');
      expect.assertions(2);
    });

    it('should return false if email has invalid field types', () => {
      //@ts-expect-error - testing invalid input
      const [valid, errors] = validateEmail({from: 1, to: 2, subject: 3, text: 4} as Email);

      expect(valid).toBe(false);
      expect(errors).toBe(
        'from is not a string, to is not a string, subject is not a string, text is not a string'
      );
      expect.assertions(2);
    });

    it('should return false if email has invalid text or html field types', () => {
      //@ts-expect-error - testing invalid input
      const [valid, errors] = validateEmail({...testEmail, text: 1} as Email);

      expect(valid).toBe(false);
      expect(errors).toBe('text is not a string');
      expect.assertions(2);
    });
  });

  describe('smtp config', () => {
    it('should have the correct smtp config', () => {
      expect(smtpConfig).toEqual({
        host: process.env.EMAIL_HOST as string,
        port: parseInt(process.env.EMAIL_PORT as string),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      expect.assertions(1);
    });
  });

  describe('create transporter', () => {
    it('should return a transporter', () => {
      const transporter = createTransporter();

      expect(transporter).toBeDefined();
      expect(transporter.verify).toBeDefined();
      expect.assertions(2);
    });
  });

  describe('send email', () => {
    // test passed - skipping so we don't send an email every time we run tests
    it('should send an email', async () => {
      const result = await sendEmail(testEmail);
      console.log('EMAIL SEND RESULT', result);
      expect(result).toBe(true);
      expect.assertions(1);
    });

    it('should throw an error if email is not valid', async () => {
      try {
        await sendEmail({} as Email);
      } catch (error) {
        expect(String(error)).toBe(
          'Error: Email is not valid: missing from, missing to, missing subject, missing text or html'
        );
        expect.assertions(1);
      }
    });
  });
});
