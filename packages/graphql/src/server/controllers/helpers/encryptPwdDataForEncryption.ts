/* istanbul ignore file */
import {encryptAES} from 'passwordkeeper.crypto';
import {IEncryptedData} from 'passwordkeeper.types';
/**
 * Encrypts the password data for storage in the database
 *
 * @param passwordData an array of strings containing the password data to be encrypted
 * @returns an array of objects containing the encrypted data and the initialization vector
 */
export const encryptPwdDataForStorage = async (
  passwordData: (IEncryptedData | undefined)[]
): Promise<(IEncryptedData | undefined)[]> => {
  const encryptedDataPromises: Promise<IEncryptedData | undefined>[] = passwordData.map(
    async (data: IEncryptedData | undefined) => {
      return data
        ? encryptAES(JSON.stringify(data), process.env.SYMMETRIC_KEY_PASSPHRASE as string)
        : undefined;
    }
  );

  return await Promise.all(encryptedDataPromises);
};
