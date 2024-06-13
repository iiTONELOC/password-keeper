import {GraphQLError} from 'graphql';
import logger from '../../../logger';
import {AuthSessionModel} from '../../../db/Models';
import {createNonce, encryptWithPublicKey} from '../../../utils';
import {generateAESEncryptionKey, encryptAES} from '../../../utils/crypto/aes-256';
import type {
  IUserDocument,
  AES_EncryptionData,
  CompleteAccountMutationPayload,
  IAuthSessionDocument
} from 'passwordkeeper.types';

const thirtyMinutes = 30 * 60 * 1000;
const twentyFourHours = 24 * 60 * 60 * 1000;

/**
 * Creates a new auth session for the user in the database and sets the
 * default expiration time for the session (30 minutes)
 * @returns {Promise<CompleteAccountMutationPayload>} - the new auth session
 */
export const createAuthSession = async ({
  publicKey,
  user,
  expiresAt
}: {
  publicKey: string;
  user: Partial<IUserDocument>;
  expiresAt?: Date;
}): Promise<CompleteAccountMutationPayload> => {
  // create a new nonce - this will be used to create an AES key
  const authSessionNonce: string | undefined = createNonce(32);

  if (!authSessionNonce) {
    logger.error('completeAccount mutationError - error creating auth session nonce!');
    throw new GraphQLError('Error creating auth session nonce');
  }

  // encrypt the nonce for storage using the aes key
  const aesPassword: string = process.env.SYMMETRIC_KEY_PASSPHRASE ?? 'password';

  // create an encryption key
  const aesEncryptionKey: Buffer = await generateAESEncryptionKey(aesPassword);

  if (!aesEncryptionKey) {
    logger.error('completeAccount mutationError - error creating encryption key!');
    throw new GraphQLError('Error creating encryption key');
  }

  // encrypt the nonce for storage in the db
  const safeAtRestNonce: AES_EncryptionData = await encryptAES(
    authSessionNonce,
    aesPassword,
    aesEncryptionKey
  );

  // force the expiresAt date if provided to be at least 30 minutes from now but not more than 24 hours
  // enforcing this here will prevent an error when creating the session
  if (expiresAt) {
    const now: Date = new Date();
    const diff: number = expiresAt.getTime() - now.getTime();

    // if the expiration time is less than 30 minutes from now, set it to 30 minutes from now
    if (diff < thirtyMinutes) {
      expiresAt = new Date(Date.now() + thirtyMinutes);

      // if the expiration time is more than 24 hours from now, set it to 24 hours from now
    } else if (diff > twentyFourHours) {
      expiresAt = new Date(Date.now() + twentyFourHours);
    }
  } else {
    // set the expiration time to 30 minutes from now by default or use the provided value
    expiresAt = new Date(Date.now() + thirtyMinutes);
  }

  // create a new auth session
  const authSession: IAuthSessionDocument = (
    await AuthSessionModel.create({
      expiresAt,
      user: user._id,
      nonce: safeAtRestNonce
    })
  ).toObject();

  if (!authSession) {
    logger.error('completeAccount mutationError - error creating auth session!');
    throw new GraphQLError('Error creating auth session');
  }

  // encrypt the nonce with the user's public key - for transmission
  const pkiEncryptedNonceWUsersPubKey: string | undefined = await encryptWithPublicKey(
    publicKey,
    authSessionNonce
  );

  if (!pkiEncryptedNonceWUsersPubKey) {
    logger.error('completeAccount mutationError - error encrypting nonce with public key!');
    throw new GraphQLError('Error encrypting nonce with public key');
  }

  // encrypt the session id with the user's public key for transmission
  const pkiEncryptedSessionIdWUsersPubKey: string | undefined = await encryptWithPublicKey(
    publicKey,
    authSession._id.toString()
  );

  if (!pkiEncryptedSessionIdWUsersPubKey) {
    logger.error('completeAccount mutationError - error encrypting session id with public key!');
    throw new GraphQLError('Error encrypting session id with public key');
  }

  logger.warn(
    `Created a new session for user: ${user.username} - expires at: ${authSession.expiresAt}`
  );

  // return the new auth session
  return {
    user,
    _id: pkiEncryptedSessionIdWUsersPubKey,
    nonce: pkiEncryptedNonceWUsersPubKey,
    expiresAt: authSession.expiresAt
  };
};
