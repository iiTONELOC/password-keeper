import {GraphQLError} from 'graphql';
import {createAuthSession, addPublicKey} from '../../helpers';
import {AccountCompletionInviteModel, AccountModel} from '../../../../db/Models';
import {decryptWithPrivateKey, getAppsPrivateKey, logger} from '../../../../utils';
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
    throw new GraphQLError('Nonce is required');
  }

  /* istanbul ignore next */
  if (!publicKey) {
    /* istanbul ignore next */
    throw new GraphQLError('Public key is required');
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
    throw new GraphQLError('Error getting private key');
  }

  const decryptedNonce: string | undefined = await decryptWithPrivateKey(privateKey, nonce);

  /* istanbul ignore next */
  if (!decryptedNonce) {
    logger.error('completeAccount:: mutationError - error decrypting nonce!');
    /* istanbul ignore next */
    throw new GraphQLError('Error decrypting nonce');
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
    throw new GraphQLError('Invite not found');
  }

  try {
    // add the public key to the user
    const updatedUserData = await addPublicKey({userId: invite.user._id, publicKey});
    // update the account status to active and add the public key
    await AccountModel.findOneAndUpdate(
      {owner: invite.user._id},
      {
        status: AccountStatusTypes.ACTIVE,
        $addToSet: {publicKeys: updatedUserData.user.publicKeys[0]}
      }
    );

    await AccountCompletionInviteModel.deleteOne({_id: invite._id});

    return createAuthSession({publicKey, user: updatedUserData.user as Partial<IUserDocument>});
  } catch (error) {
    console.error(error);
    logger.error('completeAccount:: mutationError - error adding public key!');
    // delete the invite
    /* istanbul ignore next */
    await AccountCompletionInviteModel.deleteOne({_id: invite._id});
    /* istanbul ignore next */
    throw new GraphQLError('Error completing account');
  }
};
