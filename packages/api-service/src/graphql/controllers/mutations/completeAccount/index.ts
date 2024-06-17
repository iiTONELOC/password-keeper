import {GraphQLError} from 'graphql';
import logger from '../../../../logger';
import {createAuthSession, addPublicKey} from '../../helpers';
import {AccountCompletionInviteModel} from '../../../../db/Models';
import {getPrivateKey, decryptWithPrivateKey, getPathToPrivateKey} from '../../../../utils';
import type {
  PrivateKey,
  IUserDocument,
  CompleteAccountMutationPayload,
  CompleteAccountMutationVariables,
  IAccountCompletionInviteDocument
} from 'passwordkeeper.types';

export const completeAccount = async (
  _: undefined,
  args: CompleteAccountMutationVariables,
  __: undefined
): Promise<CompleteAccountMutationPayload> => {
  const {
    completeAccountArgs: {nonce, publicKey}
  } = args;

  if (!nonce) {
    throw new GraphQLError('Nonce is required');
  }

  if (!publicKey) {
    throw new GraphQLError('Public key is required');
  }

  // decrypt the nonce with the private key
  // NORMALLY, the user would be encrypting things with their private key
  // since this is for account creation, their public key is being sent with the
  // nonce. Therefore, for this time only,they send this value back encrypted with
  // the app's public key
  const privateKeyPath: string | undefined = getPathToPrivateKey();
  const privateKey: PrivateKey | undefined = await getPrivateKey(
    privateKeyPath,
    process.env.PRIVATE_KEY_PASSPHRASE
  );

  if (!privateKey) {
    logger.error('completeAccount:: mutationError - getting private key!');
    throw new GraphQLError('Error getting private key');
  }

  const decryptedNonce: string | undefined = await decryptWithPrivateKey(privateKey, nonce);

  if (!decryptedNonce) {
    logger.error('completeAccount:: mutationError - error decrypting nonce!');
    throw new GraphQLError('Error decrypting nonce');
  }

  // find the invite
  const invite: IAccountCompletionInviteDocument | null =
    (await AccountCompletionInviteModel.findOne({
      nonce: decryptedNonce
    }).populate({
      path: 'user',
      select: '_id username email'
    })) as IAccountCompletionInviteDocument | null;

  if (!invite) {
    throw new GraphQLError('Invite not found');
  }

  try {
    // add the public key to the user
    const updatedUser = await addPublicKey(invite.user._id, publicKey);

    // delete the invite
    await AccountCompletionInviteModel.deleteOne({_id: invite._id});

    return createAuthSession({publicKey, user: updatedUser as Partial<IUserDocument>});
  } catch (error) {
    logger.error('completeAccount:: mutationError - error adding public key!');
    // delete the invite
    await AccountCompletionInviteModel.deleteOne({_id: invite._id});
    throw new GraphQLError('Error completing account');
  }
};
