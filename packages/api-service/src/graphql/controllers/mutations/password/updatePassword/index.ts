import {GraphQLError} from 'graphql';
import {logger} from '../../../../../utils';
import {EncryptedUserPasswordModel} from '../../../../../db/Models';
import {encryptPwdDataForStorage, enforceUserSession} from '../../../helpers';
import {
  AuthContext,
  IPasswordEncrypted,
  IAuthSessionDocument,
  IPasswordEncryptedAtRest,
  UpdatePasswordMutationVariables
} from 'passwordkeeper.types';

export const updatePassword = async (
  _: undefined,
  args: UpdatePasswordMutationVariables,
  context: AuthContext
): Promise<Partial<IPasswordEncrypted>> => {
  const session: IAuthSessionDocument = enforceUserSession(context);
  const userID = session.user._id;

  const loggerPrefix = 'updatePasswordMutation:: ';

  /* istanbul ignore next */
  const {id, url, name, username, expiresAt, password} = args.updatePasswordArgs ?? {};

  if (!id) {
    throw new GraphQLError('Missing required fields');
  }

  // if no fields are provided, throw an error
  if (!url && !name && !username && !expiresAt && !password) {
    throw new GraphQLError('Must provide at least one field to update');
  }

  // Find the password to update
  const existingPassword = await EncryptedUserPasswordModel.findOne({_id: id, owner: userID});

  if (!existingPassword) {
    logger.error(`${loggerPrefix}- Password - ${id} not found for user - ${userID}`);
    throw new GraphQLError('Password not found');
  }

  const [encryptedURL, encryptedName, encryptedUsername, encryptedPassword] =
    await encryptPwdDataForStorage([url, name, username, password]);

  const updatePasswordData: Partial<IPasswordEncryptedAtRest> = {
    expiresAt,
    url: encryptedURL
      ? {
          encryptedData: encryptedURL
        }
      : undefined,

    name: encryptedName
      ? {
          encryptedData: encryptedName
        }
      : undefined,

    username: encryptedUsername
      ? {
          encryptedData: encryptedUsername
        }
      : undefined,

    password: encryptedPassword
      ? {
          encryptedData: encryptedPassword
        }
      : undefined
  };

  // Update the password
  await EncryptedUserPasswordModel.updateOne({_id: id}, {...updatePasswordData});

  return {
    ...{
      url,
      name,
      _id: id,
      username,
      password,
      owner: userID,
      expiresAt: updatePasswordData.expiresAt
    }
  };
};
