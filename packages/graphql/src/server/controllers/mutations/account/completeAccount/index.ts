import {GraphQLError} from 'graphql';
import {logger} from 'passwordkeeper.logger';
import {getAppsPrivateKey} from '../../../../utils';
import {decryptWithPrivateKey} from 'passwordkeeper.crypto';
import {ACCOUNT_ERROR_MESSAGES} from '../../../../errors/messages';
import {AccountCompletionInviteModel, AccountModel} from 'passwordkeeper.database';
import {createAuthSession, addPublicKey, handleErrorMessages} from '../../../helpers';
import {
  type PrivateKey,
  type IUserDocument,
  AccountStatusTypes,
  type CompleteAccountMutationPayload,
  type CompleteAccountMutationVariables,
  type IAccountCompletionInviteDocument
} from 'passwordkeeper.types';

export const completeAccount = async (
  _: undefined,
  args: CompleteAccountMutationVariables,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  __: undefined
): Promise<CompleteAccountMutationPayload> => {
  const {
    completeAccountArgs: {nonce, publicKey}
  } = args;

  /* istanbul ignore next */
  if (!nonce) {
    /* istanbul ignore next */
    throw new GraphQLError(ACCOUNT_ERROR_MESSAGES.NONCE_REQUIRED);
  }

  /* istanbul ignore next */
  if (!publicKey) {
    /* istanbul ignore next */
    throw new GraphQLError(ACCOUNT_ERROR_MESSAGES.PUBLIC_KEY_REQUIRED);
  }

  // decrypt the nonce with the private key
  // NORMALLY, the user would be encrypting things with their private key
  // since this is for account creation, their public key is being sent with the
  // nonce. Therefore, for this time only,they send this value back encrypted with
  // the app's public key
  const privateKey: PrivateKey | undefined = await getAppsPrivateKey();

  /* istanbul ignore next */
  if (!privateKey) {
    logger.error('completeAccount:: mutationError - getting private key!');
    /* istanbul ignore next */
    throw new GraphQLError(ACCOUNT_ERROR_MESSAGES.PUBLIC_KEY_RETRIEVAL_ERROR);
  }

  const decryptedNonce: string | undefined = await decryptWithPrivateKey(privateKey, nonce);

  /* istanbul ignore next */
  if (!decryptedNonce) {
    logger.error('completeAccount:: mutationError - error decrypting nonce!');
    /* istanbul ignore next */
    throw new GraphQLError(ACCOUNT_ERROR_MESSAGES.NONCE_DECRYPT_ERROR);
  }

  // find the invite
  const invite: IAccountCompletionInviteDocument | null =
    (await AccountCompletionInviteModel.findOne({
      nonce: decryptedNonce
    }).populate({
      path: 'user',
      select: '_id username email'
      /* istanbul ignore next */
    })) as IAccountCompletionInviteDocument | null;

  /* istanbul ignore next */
  if (!invite) {
    /* istanbul ignore next */
    throw new GraphQLError(ACCOUNT_ERROR_MESSAGES.INVITE_NOT_FOUND);
  }

  try {
    // update the account's status to active
    await AccountModel.findOneAndUpdate(
      {owner: invite.user._id},
      {$set: {status: AccountStatusTypes.ACTIVE}},
      {new: true, runValidators: true}
    );
    // add the public key to the user
    const updatedUserData = await addPublicKey({userId: invite.user._id, publicKey});

    await AccountCompletionInviteModel.deleteOne({_id: invite._id});

    return createAuthSession({publicKey, user: updatedUserData.user as Partial<IUserDocument>});
  } catch (error) {
    logger.error('completeAccount:: mutationError - error adding public key!');
    // delete the invite
    /* istanbul ignore next */
    await AccountCompletionInviteModel.deleteOne({_id: invite._id});
    /* istanbul ignore next */
    throw new GraphQLError(
      handleErrorMessages(error as Error, ACCOUNT_ERROR_MESSAGES.COMPLETE_ACCOUNT_ERROR)
    );
  }
};
