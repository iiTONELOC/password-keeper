import {GraphQLError} from 'graphql';
import logger from '../../../../logger';
import {encryptAES} from '../../../../utils/crypto/aes-256';
import {UserModel, LoginInviteModel} from '../../../../db/Models';
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
  createNonce,
  verifySignature,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPrivateKey,
  getAppsPrivateKey
} from '../../../../utils';
import {findUsersPublicKey} from '../../helpers';

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
    throw new GraphQLError('Username is required');
  }

  if (!challenge) {
    throw new GraphQLError('Challenge is required');
  }

  if (!signature) {
    throw new GraphQLError('Signature is required');
  }

  // 1. look up the user by username
  const user = (await UserModel.findOne({username}).populate(
    'publicKeys'
  )) as unknown as IUserDocument;

  if (!user) {
    logger.error(`${GET_LOGIN_NONCE} User: ${username} - ERROR -  User: ${username} was not found`);
    throw new GraphQLError('User not found');
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
    throw new GraphQLError('User public key not found');
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
    throw new GraphQLError('Error getting private key');
  }

  // decrypt the challenge with the app's private key
  const decryptedChallenge: string | undefined = await decryptWithPrivateKey(privateKey, challenge);
  /* istanbul ignore next */
  if (!decryptedChallenge) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - could not decrypt challenge`);
    /* istanbul ignore next */
    throw new GraphQLError('Error decrypting challenge');
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
    throw new GraphQLError('Error verifying signature');
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
    throw new GraphQLError('Error re-encrypting challenge');
  }

  // 6. create a nonce, encrypt it with the user's public key
  const nonce: string | undefined = createNonce();
  /* istanbul ignore next */
  if (!nonce) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - there was an error creating a nonce`);
    /* istanbul ignore next */
    throw new GraphQLError('Error creating nonce');
  }

  // encrypt the nonce with the user's public key - for transport
  const userEncryptedNonce: string | undefined = await encryptWithPublicKey(userPublicKey, nonce);
  /* istanbul ignore next */
  if (!userEncryptedNonce) {
    /* istanbul ignore next */
    logger.error(`${logHeader} - ERROR - there was an error signing the nonce`);
    /* istanbul ignore next */
    throw new GraphQLError('Error signing nonce');
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
    throw new GraphQLError('Error encrypting nonce');
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
    throw new GraphQLError('Error encrypting challenge');
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
    throw new GraphQLError('Error creating login invite');
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
