import {GraphQLError} from 'graphql';
import logger from '../../../../logger';
import {encryptAES} from '../../../../utils/crypto/aes-256';
import {UserModel, LoginInviteModel} from '../../../../db/Models';
import type {
  PrivateKey,
  IUserDocument,
  IPublicKeyDocument,
  AES_EncryptionData,
  ILoginInviteDocument,
  GetLoginNonceMutationPayload,
  GetLoginNonceMutationVariables
} from 'passwordkeeper.types';
import {
  hashData,
  createNonce,
  getPrivateKey,
  verifySignature,
  getPathToPrivateKey,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPrivateKey
} from '../../../../utils';

const GET_LOGIN_NONCE = 'getLoginNonce mutation::';

export const getLoginNonce = async (
  _: undefined,
  args: GetLoginNonceMutationVariables,
  __: undefined
): Promise<GetLoginNonceMutationPayload> => {
  const {
    getLoginNonceArgs: {username, challenge, signature, keyIndex}
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

  // Create a uniform log header for this mutation
  const logHeader = `${GET_LOGIN_NONCE} User: ${user.username} - ${user._id}`;

  logger.warn(`${logHeader} requested a login nonce`);

  if (!user) {
    logger.error(`${GET_LOGIN_NONCE} User: ${username} - ERROR -  User: ${username} was not found`);
    throw new GraphQLError('User not found');
  }

  // 2. get the user's public key from the db
  const userPublicKey: IPublicKeyDocument = user?.publicKeys?.[
    keyIndex ?? 0
  ] as unknown as IPublicKeyDocument;

  logger.warn(`${logHeader} retrieving public key for user`);

  if (!userPublicKey) {
    logger.error(`${logHeader} - ERROR -  no public key found for user`);
    throw new GraphQLError('User public key not found');
  }

  // 3. decrypt the challenge with the app's private key
  const privateKeyPath: string = getPathToPrivateKey();

  logger.warn(`${logHeader} accessing private key to decrypt challenge for user`);

  // get the app's private key - decrypt the key using the passphrase
  const privateKey: PrivateKey | undefined = await getPrivateKey(
    privateKeyPath,
    process.env.PRIVATE_KEY_PASSPHRASE
  );

  if (!privateKey) {
    logger.error(`${logHeader} - ERROR - no private key found for app`);
    throw new GraphQLError('Error getting private key');
  }

  // decrypt the challenge with the app's private key
  const decryptedChallenge: string | undefined = await decryptWithPrivateKey(privateKey, challenge);

  if (!decryptedChallenge) {
    logger.error(`${logHeader} - ERROR - could not decrypt challenge`);
    throw new GraphQLError('Error decrypting challenge');
  }

  // 4. Verify the signature which is the hash of the username + challenge signed with the user's private key
  // generate a sha256 hash of the username + challenge
  const verifiedSignature: boolean = await verifySignature(
    user.username,
    decryptedChallenge,
    signature,
    userPublicKey.key
  );

  if (!verifiedSignature) {
    logger.error(`${logHeader} - ERROR - could not verify signature`);
    throw new GraphQLError('Error verifying signature');
  }

  // 5. re-encrypt the challenge with the user's public key - for transport
  const reEncryptedChallenge: string | undefined = await encryptWithPublicKey(
    userPublicKey.key,
    decryptedChallenge
  );

  if (!reEncryptedChallenge) {
    logger.error(`${logHeader} - ERROR - could not re-encrypt challenge`);
    throw new GraphQLError('Error re-encrypting challenge');
  }

  // 6. create a nonce, encrypt it with the user's public key
  const nonce: string | undefined = createNonce();

  if (!nonce) {
    logger.error(`${logHeader} - ERROR - there was an error creating a nonce`);
    throw new GraphQLError('Error creating nonce');
  }

  // encrypt the nonce with the user's public key - for transport
  const userEncryptedNonce: string | undefined = await encryptWithPublicKey(
    userPublicKey.key,
    nonce
  );

  if (!userEncryptedNonce) {
    logger.error(`${logHeader} - ERROR - there was an error signing the nonce`);
    throw new GraphQLError('Error signing nonce');
  }

  // 7. Create the login invite in the db but encrypt the nonce
  //    and challenge with the app's AES key for safe storage
  const safeAtRestNonce: AES_EncryptionData = await encryptAES(
    nonce,
    process.env.SYMMETRIC_KEY_PASSPHRASE as string
  );

  if (!safeAtRestNonce) {
    logger.error(`${logHeader} - ERROR - there was an error encrypting the nonce`);
    throw new GraphQLError('Error encrypting nonce');
  }

  // create the safe at rest challenge
  const safeAtRestChallenge: AES_EncryptionData = await encryptAES(
    decryptedChallenge,
    process.env.SYMMETRIC_KEY_PASSPHRASE as string
  );

  if (!safeAtRestChallenge) {
    logger.error(`${logHeader} - ERROR - there was an error encrypting the challenge`);
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

  if (!loginInvite) {
    logger.error(`${logHeader} - ERROR - there was an error creating the login invite`);
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
