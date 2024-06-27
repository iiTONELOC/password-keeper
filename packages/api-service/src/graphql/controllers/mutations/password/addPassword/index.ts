import {GraphQLError} from 'graphql';
import {logger} from '../../../../../utils';
import {encryptPwdDataForStorage, enforceUserSession} from '../../../helpers';
import {UserModel, EncryptedUserPasswordModel, AccountModel} from 'passwordkeeper.database';
import {
  AuthContext,
  IEncryptedData,
  IPasswordEncrypted,
  IAuthSessionDocument,
  IPasswordEncryptedAtRest,
  AddPasswordMutationVariables
} from 'passwordkeeper.types';

export const addPassword = async (
  _: undefined,
  args: AddPasswordMutationVariables,
  context: AuthContext
): Promise<IPasswordEncrypted> => {
  const session: IAuthSessionDocument = enforceUserSession(context);
  const userID = session.user._id;

  /* istanbul ignore next */
  const {url, name, username, password} = args.addPasswordArgs ?? {};

  // if name, username, or password is missing, throw an error
  if (!name || !username || !password) {
    throw new GraphQLError('Missing required fields');
  }

  const currentNumberOfPasswords: number = session?.user?.account?.passwords?.length;
  const maxNumberOfPasswords: number = session?.user?.account?.accountType?.maxPasswords;

  if (currentNumberOfPasswords < maxNumberOfPasswords) {
    try {
      const [encryptedURL, encryptedName, encryptedUsername, encryptedPassword] =
        (await encryptPwdDataForStorage([url, name, username, password])) as IEncryptedData[];

      const pwdCreationData: IPasswordEncryptedAtRest = {
        name: {
          encryptedData: encryptedName
        },
        username: {
          encryptedData: encryptedUsername
        },
        password: {
          encryptedData: encryptedPassword
        },
        url: encryptedURL
          ? /* istanbul ignore next */
            {
              encryptedData: encryptedURL
            }
          : /* istanbul ignore next */
            undefined,
        owner: userID
      };

      // create the password object in the database
      const newEncryptedAtRestUserPassword = await EncryptedUserPasswordModel.create(
        pwdCreationData
      );

      // add the password to the user's account
      await AccountModel.findByIdAndUpdate(session?.user?.account._id, {
        $addToSet: {passwords: newEncryptedAtRestUserPassword._id}
      });

      // add the password to the user's password list
      await UserModel.findByIdAndUpdate(
        {_id: userID},
        {$addToSet: {passwords: newEncryptedAtRestUserPassword._id}}
      );

      return {
        url,
        name,
        username,
        password,
        owner: userID,
        _id: newEncryptedAtRestUserPassword._id,
        expiresAt: newEncryptedAtRestUserPassword.expiresAt
      };

      /* istanbul ignore next */
    } catch (error) {
      /* istanbul ignore next */
      logger.error('addPassword:: error -', error);
      /* istanbul ignore next */
      throw new GraphQLError('Error adding password');
    }
  } else {
    throw new GraphQLError('Max number of passwords reached');
  }
};
