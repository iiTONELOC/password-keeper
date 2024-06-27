import {GraphQLError} from 'graphql';
import {LoginInviteModel} from 'passwordkeeper.database';
import {decryptAES} from '../../../../../utils/crypto/aes-256';
import {LOGIN_ERROR_MESSAGES} from '../../../../errors/messages';
import {createAuthSession, findUsersPublicKey} from '../../../helpers';
import {
  logger,
  verifySignature,
  getAppsPrivateKey,
  decryptWithPrivateKey
} from '../../../../../utils';
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
    throw new GraphQLError(LOGIN_ERROR_MESSAGES.NONCE_REQUIRED);
  }

  if (!signature || signature === undefined || signature === '') {
    throw new GraphQLError(LOGIN_ERROR_MESSAGES.SIGNATURE_REQUIRED);
  }

  const logHeader = 'completeLogin mutation::';

  // decrypt the nonce with the app's private key
  const privateKey = await getAppsPrivateKey();
  /* istanbul ignore next */
  if (!privateKey) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not retrieve the private key!`);
    /* istanbul ignore next */
    throw new GraphQLError(LOGIN_ERROR_MESSAGES.FETCH_PRIVATE_KEY_ERROR);
  }

  const decryptedNonce = await decryptWithPrivateKey(privateKey, nonce);

  if (!decryptedNonce) {
    logger.error(`${logHeader} - ERROR - could not decrypt the nonce!`);
    throw new GraphQLError(LOGIN_ERROR_MESSAGES.ERROR_DECRYPTING_NONCE);
  }

  // find the login invite to get the user's id and their public key so we can verify the signature
  // decrypted signature = hash(userid + nonce))
  const userInvite = (
    await LoginInviteModel.findOne({
      user: userId
    }).populate({
      path: 'user',
      select: '_id username email publicKeys account',
      populate: [
        {path: 'publicKeys'},
        {path: 'account', select: 'accountType status', populate: {path: 'accountType'}}
      ]
    })
  )?.toObject() as ILoginInviteDocument;

  if (!userInvite) {
    logger.error(`${logHeader} - ERROR - could not find the login invite!`);
    throw new GraphQLError(LOGIN_ERROR_MESSAGES.LOGIN_INVITE_NOT_FOUND);
  }

  /* istanbul ignore next */
  const userPublicKey: string | undefined = findUsersPublicKey(userInvite.user, publicKeyId);
  /* istanbul ignore next */
  if (!userPublicKey) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not get the user's public key!`);
    /* istanbul ignore next */
    throw new GraphQLError(LOGIN_ERROR_MESSAGES.PUBLIC_KEY_NOT_FOUND);
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
    throw new GraphQLError(LOGIN_ERROR_MESSAGES.SIGNATURE_VERIFICATION_FAILED);
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
    throw new GraphQLError(LOGIN_ERROR_MESSAGES.ERROR_DECRYPTING_NONCE);
  }

  // verify the nonce from the client matches the nonce from the db
  /* istanbul ignore next */
  if (decryptedNonce !== decryptedInviteNonceFromDb) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - the nonce does not match the invite nonce!`);
    /* istanbul ignore next */
    throw new GraphQLError(LOGIN_ERROR_MESSAGES.NONCE_NOT_EQUAL);
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
