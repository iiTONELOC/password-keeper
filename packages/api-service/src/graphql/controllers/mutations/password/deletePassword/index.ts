import {GraphQLError} from 'graphql';
import {logger} from '../../../../../utils';
import {enforceUserSession} from '../../../helpers';
import {decryptPwdFromStorage} from '../../../helpers/decryptPwdFromStorage';
import {AccountModel, EncryptedUserPasswordModel} from 'passwordkeeper.database';
import {
  AuthContext,
  IPasswordEncrypted,
  IAuthSessionDocument,
  IUserPasswordDocument
} from 'passwordkeeper.types';

export const deletePassword = async (
  _: undefined,
  args: {passwordId: string},
  context: AuthContext
): Promise<IPasswordEncrypted> => {
  const session: IAuthSessionDocument = enforceUserSession(context);
  const userID = session.user._id;

  const loggerPrefix = 'deletePasswordMutation:: ';

  if (!args.passwordId) {
    throw new GraphQLError('Missing required fields');
  }

  // Find the password to delete
  const existingPassword = (
    await EncryptedUserPasswordModel.findOne({
      _id: args.passwordId,
      owner: userID
    })
  )?.toObject() as IUserPasswordDocument;

  if (!existingPassword) {
    logger.error(`${loggerPrefix}- Password - ${args.passwordId} not found for user - ${userID}`);
    throw new GraphQLError('Password not found');
  }

  const decryptedFromStorage = await decryptPwdFromStorage(existingPassword);

  await EncryptedUserPasswordModel.deleteOne({_id: args.passwordId, owner: userID});
  await AccountModel.updateOne(
    {_id: session.user.account._id},
    {$pull: {passwords: args.passwordId}}
  );

  return decryptedFromStorage as unknown as IPasswordEncrypted;
};
