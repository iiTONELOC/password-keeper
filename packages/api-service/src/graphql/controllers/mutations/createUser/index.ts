import {GraphQLError} from 'graphql';
import {UserModel, AccountCompletionInviteModel} from '../../../../db/Models';
import type {
  IUserDocument,
  CreateUserMutationPayload,
  CreateUserMutationVariables,
  IAccountCompletionInviteDocument
} from 'passwordkeeper.types';
import {
  createNonce,
  encryptWithPrivateKey,
  getPathToPrivateKey,
  getPrivateKey
} from '../../../../utils';
import logger from '../../../../logger';
import {warn} from 'winston';

export const createUser = async (
  _: undefined,
  args: CreateUserMutationVariables,
  __: undefined
): Promise<CreateUserMutationPayload> => {
  const {
    createUserArgs: {username, email}
  } = args;

  const loggerHeader = 'createUser mutation::';

  if (!username) {
    throw new GraphQLError('Username is required');
  }

  if (!email) {
    throw new GraphQLError('Email is required');
  }

  try {
    logger.warn(`${loggerHeader} User: ${username} requested to create an account`);
    const user: IUserDocument = (await UserModel.create({username, email}))?.toObject();

    if (!user) {
      throw new GraphQLError('Failed to create user');
    }

    // create a random nonce
    const nonce = createNonce();
    // lookup the path to the private key
    const privateKeyPath = getPathToPrivateKey();
    // get the private key
    logger.warn(`${loggerHeader} accessing private key for user creation: ${username}`);
    const privateKey = await getPrivateKey(privateKeyPath, process.env.PRIVATE_KEY_PASSPHRASE);

    if (!nonce) {
      logger.error(`${loggerHeader} Error creating nonce for user: ${username}`);
      throw new GraphQLError('Error creating nonce');
    }

    if (!privateKey) {
      logger.error(`${loggerHeader} Error getting private key for user: ${username}`);
      throw new GraphQLError('Error getting private key');
    }

    // sign the nonce with the private key
    const signedNonce = await encryptWithPrivateKey(privateKey, nonce);

    if (!signedNonce) {
      logger.error(`${loggerHeader} Error signing nonce for user: ${username}`);
      throw new GraphQLError('Error signing nonce');
    }

    logger.warn(`${loggerHeader} User: ${username} created successfully. Generating invite token.`);
    // const signedNonce = await encryptWithPrivateKey
    let inviteToken: IAccountCompletionInviteDocument = (
      await AccountCompletionInviteModel.create({
        nonce,
        user: user._id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours
      })
    ).toObject();

    return {user, inviteToken: {token: signedNonce, expiresAt: inviteToken.expiresAt}};
  } catch (error: any) {
    if (error?.toString()?.includes('E11000 duplicate key error')) {
      logger.error(`${loggerHeader} User: ${username} already exists!`);
      throw new GraphQLError('User already exists');
    } else {
      logger.error(`${loggerHeader} Error creating user: ${error}`);
      throw new GraphQLError('Error creating user');
    }
  }
};
