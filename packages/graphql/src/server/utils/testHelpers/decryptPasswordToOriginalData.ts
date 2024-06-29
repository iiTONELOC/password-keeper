/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* istanbul ignore file */
import {Types} from 'mongoose';
import {decryptAES} from 'passwordkeeper.crypto';
import {IUserPasswordDocument} from 'passwordkeeper.types';

export type PlainTextPassword = {
  _id: string | Types.ObjectId;
  url?: string;
  name: string;
  username: string;
  password: string;
  expiresAt?: Date;
  owner: string | Types.ObjectId;
};
export const decryptPasswordToOriginalData = async (
  testKey: string,
  UserPassword: IUserPasswordDocument
): Promise<PlainTextPassword> => {
  const encryptedFields = ['url', 'name', 'username', 'password'];

  for (const [key, value] of Object.entries(UserPassword)) {
    if (encryptedFields.includes(key)) {
      const decryptedData = await decryptAES(
        value.encryptedData,
        process.env.SYMMETRIC_KEY_PASSPHRASE as string
      );
      expect(decryptedData).toBeDefined();
      // @ts-expect-error - we are decrypting to the original user data
      UserPassword[key as keyof IUserPasswordDocument] = await decryptAES(
        JSON.parse(decryptedData),
        testKey
      );
    }
  }

  return UserPassword as unknown as PlainTextPassword;
};
