import {GraphQLError} from 'graphql';
import {LoginInviteModel} from '../../../../db/Models';
import {decryptAES} from '../../../../utils/crypto/aes-256';
import {createAuthSession, findUsersPublicKey} from '../../helpers';
import {verifySignature, decryptWithPrivateKey, getAppsPrivateKey, logger} from '../../../../utils';
import type {
  ILoginInviteDocument,
  CompleteLoginMutationPayload,
  CompleteLoginMutationVariables
} from 'passwordkeeper.types';

export const completeLogin = async (
  _: undefined,
  args: CompleteLoginMutationVariables,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  __: undefined
): Promise<CompleteLoginMutationPayload> => {
  const {completeLoginArgs} = args;
  /* istanbul ignore next */
  const {nonce, signature, userId, publicKeyId} = completeLoginArgs ?? {};

  if (!nonce || nonce === undefined || nonce === '') {
    throw new GraphQLError('Nonce is required');
  }

  if (!signature || signature === undefined || signature === '') {
    throw new GraphQLError('Signature is required');
  }

  const logHeader = 'completeLogin mutation::';

  // decrypt the nonce with the app's private key
  const privateKey = await getAppsPrivateKey();
  /* istanbul ignore next */
  if (!privateKey) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not retrieve the private key!`);
    /* istanbul ignore next */
    throw new GraphQLError('Error getting private key');
  }

  const decryptedNonce = await decryptWithPrivateKey(privateKey, nonce);

  if (!decryptedNonce) {
    logger.error(`${logHeader} - ERROR - could not decrypt the nonce!`);
    throw new GraphQLError('Error decrypting nonce');
  }

  // find the login invite to get the user's id and their public key so we can verify the signature
  // decrypted signature = hash(userid + nonce))
  const userInvite = (
    await LoginInviteModel.findOne({
      user: userId
    }).populate({
      path: 'user',
      select: '_id username email publicKeys',
      populate: 'publicKeys'
    })
  )?.toObject() as ILoginInviteDocument;

  if (!userInvite) {
    logger.error(`${logHeader} - ERROR - could not find the login invite!`);
    throw new GraphQLError('Login invite not found');
  }

  /* istanbul ignore next */
  const userPublicKey: string | undefined = findUsersPublicKey(userInvite.user, publicKeyId);
  /* istanbul ignore next */
  if (!userPublicKey) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not get the user's public key!`);
    /* istanbul ignore next */
    throw new GraphQLError('User public key not found');
  }

  /* istanbul ignore next */
  const verifiedSignature = await verifySignature(
    userInvite.user._id.toString(),
    decryptedNonce,
    signature,
    userPublicKey
  );

  /* istanbul ignore next */
  if (!verifiedSignature) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not verify the signature!`);
    /* istanbul ignore next */
    throw new GraphQLError('Error verifying signature');
  }

  // decrypt the nonce from the database using the app's private aes key
  /* istanbul ignore next */
  const decryptedInviteNonceFromDb = await decryptAES(
    userInvite.nonce,
    process.env.SYMMETRIC_KEY_PASSPHRASE as string
  );

  /* istanbul ignore next */
  if (!decryptedInviteNonceFromDb) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not decrypt the nonce from the db!`);
    /* istanbul ignore next */
    throw new GraphQLError('Error decrypting nonce from db');
  }

  // verify the nonce from the client matches the nonce from the db
  /* istanbul ignore next */
  if (decryptedNonce !== decryptedInviteNonceFromDb) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - the nonce does not match the invite nonce!`);
    /* istanbul ignore next */
    throw new GraphQLError('Nonce does not match invite nonce');
  }

  // remove the public keys from instance of the user so they are not returned to the client
  userInvite.user.publicKeys = [];
  // remove the login invite from the database
  await LoginInviteModel.findByIdAndDelete(userInvite._id);
  logger.warn(`${logHeader} - User: ${userInvite.user.username} has completed login`);

  // all checks passed, create the auth session
  return await createAuthSession({
    user: userInvite.user,
    publicKey: userPublicKey
  });
};
