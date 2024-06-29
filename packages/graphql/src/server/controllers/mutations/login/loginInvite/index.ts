import {GraphQLError} from 'graphql';
import {logger} from 'passwordkeeper.logger';
import {findUsersPublicKey} from '../../../helpers';
import {getAppsPrivateKey} from '../../../../utils';
import {UserModel, LoginInviteModel} from 'passwordkeeper.database';
import {GET_LOGIN_NONCE_ERROR_MESSAGES} from '../../../../errors/messages';
import type {
  PrivateKey,
  IUserDocument,
  AES_EncryptionData,
  ILoginInviteDocument,
  GetLoginNonceMutationPayload,
  GetLoginNonceMutationVariables
} from 'passwordkeeper.types';
import {
  hashData,
  encryptAES,
  createNonce,
  verifySignature,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPrivateKey
} from 'passwordkeeper.crypto';

const GET_LOGIN_NONCE = 'getLoginNonce mutation::';

export const getLoginNonce = async (
  _: undefined,
  args: GetLoginNonceMutationVariables,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  __: undefined
): Promise<GetLoginNonceMutationPayload> => {
  const {
    getLoginNonceArgs: {username, challenge, signature, publicKeyId}
  } = args;

  if (!username) {
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.USERNAME_REQUIRED);
  }

  if (!challenge) {
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.CHALLENGE_REQUIRED);
  }

  if (!signature) {
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.SIGNATURE_REQUIRED);
  }

  // 1. look up the user by username
  const user = (await UserModel.findOne({username}).populate(
    'publicKeys'
  )) as unknown as IUserDocument;

  if (!user) {
    logger.error(`${GET_LOGIN_NONCE} User: ${username} - ERROR -  User: ${username} was not found`);
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // Create a uniform log header for this mutation
  const logHeader = `${GET_LOGIN_NONCE} User: ${user.username} - ${user._id}`;

  logger.warn(`${logHeader} requested a login nonce`);

  // 2. get the user's public key from the db
  const userPublicKey: string | undefined = findUsersPublicKey(user, publicKeyId);

  logger.warn(`${logHeader} retrieving public key for user`);
  /* istanbul ignore next */
  if (!userPublicKey) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR -  no public key found for user`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.PUBLIC_KEY_NOT_FOUND);
  }

  // 3. decrypt the challenge with the app's private key
  logger.warn(`${logHeader} accessing private key to decrypt challenge for user`);

  // get the app's private key - decrypt the key using the passphrase
  const privateKey: PrivateKey | undefined = await getAppsPrivateKey();
  /* istanbul ignore next */
  if (!privateKey) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - no private key found for app`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.PRIVATE_KEY_ERROR);
  }

  // decrypt the challenge with the app's private key
  const decryptedChallenge: string | undefined = await decryptWithPrivateKey(privateKey, challenge);
  /* istanbul ignore next */
  if (!decryptedChallenge) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not decrypt challenge`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.CHALLENGE_DECRYPT_ERROR);
  }

  // 4. Verify the signature which is the hash of the username + challenge signed with the user's private key
  // generate a sha256 hash of the username + challenge
  const verifiedSignature: boolean = await verifySignature(
    user.username,
    decryptedChallenge,
    signature,
    userPublicKey
  );
  /* istanbul ignore next */
  if (!verifiedSignature) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not verify signature`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.SIGNATURE_VERIFICATION_FAILED);
  }

  // 5. re-encrypt the challenge with the user's public key - for transport
  const reEncryptedChallenge: string | undefined = await encryptWithPublicKey(
    userPublicKey,
    decryptedChallenge
  );
  /* istanbul ignore next */
  if (!reEncryptedChallenge) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not re-encrypt challenge`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.RE_ENCRYPT_CHALLENGE_ERROR);
  }

  // 6. create a nonce, encrypt it with the user's public key
  const nonce: string | undefined = createNonce();
  /* istanbul ignore next */
  if (!nonce) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - there was an error creating a nonce`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.NONCE_CREATION_ERROR);
  }

  // encrypt the nonce with the user's public key - for transport
  const userEncryptedNonce: string | undefined = await encryptWithPublicKey(userPublicKey, nonce);
  /* istanbul ignore next */
  if (!userEncryptedNonce) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - there was an error signing the nonce`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.NONCE_SIGNING_ERROR);
  }

  // 7. Create the login invite in the db but encrypt the nonce
  //    and challenge with the app's AES key for safe storage
  const safeAtRestNonce: AES_EncryptionData = await encryptAES(
    nonce,
    process.env.SYMMETRIC_KEY_PASSPHRASE as string
  );
  /* istanbul ignore next */
  if (!safeAtRestNonce) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - there was an error encrypting the nonce`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.NONCE_ENCRYPTION_AT_REST_ERROR);
  }

  // create the safe at rest challenge
  const safeAtRestChallenge: AES_EncryptionData = await encryptAES(
    decryptedChallenge,
    process.env.SYMMETRIC_KEY_PASSPHRASE as string
  );
  /* istanbul ignore next */
  if (!safeAtRestChallenge) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - there was an error encrypting the challenge`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.CHALLENGE_ENCRYPTION_AT_REST_ERROR);
  }

  // create the login invite in the db
  const loginInvite: ILoginInviteDocument = (
    await LoginInviteModel.create({
      user: user._id,
      nonce: safeAtRestNonce,
      challenge: safeAtRestChallenge
    })
  ).toObject();
  /* istanbul ignore next */
  if (!loginInvite) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - there was an error creating the login invite`);
    /* istanbul ignore next */
    throw new GraphQLError(GET_LOGIN_NONCE_ERROR_MESSAGES.CREATE_INVITE_ERROR);
  }

  logger.warn(`${logHeader} - SUCCESS - login nonce and challenge created`);
  // 8. return the user encrypted nonce challengeResponse and a signature of the data
  const payloadHash: string = (await hashData(nonce + decryptedChallenge)) as string;
  const signedPayload: string = (await encryptWithPrivateKey(privateKey, payloadHash)) as string;

  return {
    nonce: userEncryptedNonce,
    challengeResponse: reEncryptedChallenge,
    signature: signedPayload
  };
};
