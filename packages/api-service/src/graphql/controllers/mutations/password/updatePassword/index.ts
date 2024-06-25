import {GraphQLError} from 'graphql';
import {logger} from '../../../../../utils';
import {EncryptedUserPasswordModel} from '../../../../../db/Models';
import {encryptPwdDataForStorage, enforceUserSession} from '../../../helpers';
import {
  AuthContext,
  IPasswordEncrypted,
  IAuthSessionDocument,
  IPasswordEncryptedAtRest,
  UpdatePasswordMutationVariables,
  IUserPasswordDocument
} from 'passwordkeeper.types';
import {decryptPwdFromStorage} from '../../../helpers/decryptPwdFromStorage';

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
    url: encryptedURL ? {encryptedData: encryptedURL} : undefined,
    name: encryptedName ? {encryptedData: encryptedName} : undefined,
    username: encryptedUsername ? {encryptedData: encryptedUsername} : undefined,
    password: encryptedPassword ? {encryptedData: encryptedPassword} : undefined
  };

  // Update the password
  const updated = (
    await EncryptedUserPasswordModel.findOneAndUpdate(
      {_id: id},
      {...updatePasswordData},
      {new: true, runValidators: true}
    )
  )?.toObject() as IUserPasswordDocument;

  const decryptedFromStorage: IPasswordEncrypted = await decryptPwdFromStorage(updated);
  return decryptedFromStorage;
};
