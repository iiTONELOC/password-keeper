/* istanbul ignore file */
import {decryptAES} from 'passwordkeeper.crypto';
import {IPasswordEncrypted, IUserPasswordDocument} from 'passwordkeeper.types';

export const decryptPwdFromStorage = async (
  password: IUserPasswordDocument
): Promise<IPasswordEncrypted> => {
  const encryptedFields = ['url', 'name', 'username', 'password'];

  // loop through the password object and decrypt the encrypted fields
  for (const [key, value] of Object.entries(password)) {
    if (encryptedFields.includes(key)) {
      // decrypt the data
      const decryptedData = await decryptAES(
        value.encryptedData,
        process.env.SYMMETRIC_KEY_PASSPHRASE as string
      );

      // update the user object with the decrypted data
      password[key as keyof IUserPasswordDocument] = JSON.parse(decryptedData);
    }
  }

  // return the user object with the decrypted from rest data
  return password as unknown as IPasswordEncrypted;
};
