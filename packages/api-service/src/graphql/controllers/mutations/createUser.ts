import {GraphQLError} from 'graphql';
import {UserModel, AccountCompletionInviteModel} from '../../../db/Models';
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
} from '../../../utils';
import logger from '../../../logger';

export const createUser = async (
  _: undefined,
  args: CreateUserMutationVariables,
  __: undefined
): Promise<CreateUserMutationPayload> => {
  const {
    createUserArgs: {username, email}
  } = args;

  if (!username) {
    throw new GraphQLError('Username is required');
  }

  if (!email) {
    throw new GraphQLError('Email is required');
  }

  try {
    const user: IUserDocument = (await UserModel.create({username, email}))?.toObject();

    if (!user) {
      throw new GraphQLError('Failed to create user');
    }

    // create a random nonce
    const nonce = createNonce();
    // lookup the path to the private key
    const privateKeyPath = getPathToPrivateKey();
    // get the private key
    const privateKey = await getPrivateKey(privateKeyPath, process.env.PRIVATE_KEY_PASSPHRASE);

    if (!nonce) {
      logger.error('createUser mutationError - error creating nonce!');
      throw new GraphQLError('Error creating nonce');
    }

    if (!privateKey) {
      logger.error('createUser mutationError - getting private key!');
      throw new GraphQLError('Error getting private key');
    }

    // sign the nonce with the private key
    const signedNonce = await encryptWithPrivateKey(privateKey, nonce);

    if (!signedNonce) {
      logger.error('createUser mutationError - error signing nonce!');
      throw new GraphQLError('Error signing nonce');
    }

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
      throw new GraphQLError('User already exists');
    } else {
      logger.error('createUser mutationError', error);
      throw new GraphQLError('Error creating user');
    }
  }
};
