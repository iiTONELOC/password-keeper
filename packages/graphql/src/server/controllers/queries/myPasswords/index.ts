import {GraphQLError} from 'graphql';
import {logger} from 'passwordkeeper.logger';
import {handleErrorMessages} from '../../helpers';
import {enforceUserSession} from '../../helpers/enforceUserSession';
import {decryptPwdFromStorage} from '../../helpers/decryptPwdFromStorage';
import type {
  AuthContext,
  IPasswordEncrypted,
  IUserPasswordDocument,
  QueryMyPasswordsResponse
} from 'passwordkeeper.types';

export const myPasswords = async (
  _: undefined,
  __: undefined,
  context: AuthContext | undefined
): Promise<QueryMyPasswordsResponse> => {
  try {
    const session = enforceUserSession(context as AuthContext);

    // remove the public keys from the user session
    session.user.publicKeys = [];

    // decrypt the passwords from storage at rest
    const decryptedPasswords = async (): Promise<IPasswordEncrypted[]> => {
      return await Promise.all(
        session.user.passwords.map(async (password: IUserPasswordDocument) => {
          return await decryptPwdFromStorage(password);
        })
      );
    };

    return await decryptedPasswords();
  } catch (error) {
    logger.error('Query My Passwords:: error -', error);
    throw new GraphQLError(handleErrorMessages(error as Error));
  }
};
