import {GraphQLError} from 'graphql';
import logger from '../../../../logger';
import {createAuthSession} from '../../helpers';
import {LoginInviteModel} from '../../../../db/Models';
import {
  hashData,
  getPrivateKey,
  getPathToPrivateKey,
  decryptWithPublicKey,
  decryptWithPrivateKey
} from '../../../../utils';
import type {
  ILoginInviteDocument,
  CompleteLoginMutationPayload,
  CompleteLoginMutationVariables
} from 'passwordkeeper.types';
import {decryptAES} from '../../../../utils/crypto/aes-256';

export const completeLogin = async (
  _: undefined,
  args: CompleteLoginMutationVariables,
  __: undefined
): Promise<CompleteLoginMutationPayload> => {
  const {
    completeLoginArgs: {nonce, signature, userId}
  } = args;

  if (!nonce) {
    throw new GraphQLError('Nonce is required');
  }

  if (!signature) {
    throw new GraphQLError('Signature is required');
  }

  const logHeader = 'completeLogin mutation::';

  // decrypt the nonce with the app's private key
  const privateKeyPath = getPathToPrivateKey();
  const privateKey = await getPrivateKey(privateKeyPath, process.env.PRIVATE_KEY_PASSPHRASE);

  if (!privateKey) {
    logger.error(`${logHeader} - ERROR - could not retrieve the private key!`);
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

  // get the user's public key from the userInvite data
  const userPublicKey = userInvite?.user?.publicKeys?.[0]?.key;

  if (!userPublicKey) {
    logger.error(`${logHeader} - ERROR - could not get the user's public key!`);
    throw new GraphQLError('User public key not found');
  }

  // verify the signature
  const reproducedHash = await hashData(userInvite.user._id + decryptedNonce);

  if (!reproducedHash) {
    logger.error(`${logHeader} - ERROR - could not reproduce the hash!`);
    throw new GraphQLError('Error hashing data');
  }

  // decrypt the signature with the user's public key
  const decryptedSignature = await decryptWithPublicKey(userPublicKey, signature);

  if (!decryptedSignature) {
    logger.error(`${logHeader} - ERROR - could not decrypt the signature!`);
    throw new GraphQLError('Error decrypting signature');
  }

  // verify the decrypted signature matches the hash
  if (reproducedHash !== decryptedSignature) {
    logger.error(`${logHeader} - ERROR - the signature does not match the hash!`);
    throw new GraphQLError('Signature does not match hash');
  }

  // decrypt the nonce from the database using the app's private aes key
  const decryptedInviteNonceFromDb = await decryptAES(
    userInvite.nonce,
    process.env.SYMMETRIC_KEY_PASSPHRASE as string
  );

  if (!decryptedInviteNonceFromDb) {
    logger.error(`${logHeader} - ERROR - could not decrypt the nonce from the db!`);
    throw new GraphQLError('Error decrypting nonce from db');
  }

  // verify the nonce from the client matches the nonce from the db
  if (decryptedNonce !== decryptedInviteNonceFromDb) {
    logger.error(`${logHeader} - ERROR - the nonce does not match the invite nonce!`);
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
