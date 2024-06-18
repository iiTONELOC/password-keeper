import {GraphQLError} from 'graphql';
import {UserModel, AccountCompletionInviteModel} from '../../../../db/Models';
import {createNonce, getAppsPrivateKey, encryptWithPrivateKey, logger} from '../../../../utils';
import type {
  IUserDocument,
  CreateUserMutationPayload,
  CreateUserMutationVariables,
  IAccountCompletionInviteDocument
} from 'passwordkeeper.types';

export const createUser = async (
  _: undefined,
  args: CreateUserMutationVariables,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const user: IUserDocument = (
      await UserModel.create({username, email, userRole: 'Account Owner'})
    )?.toObject();

    // create a random nonce
    const nonce = createNonce();
    /* istanbul ignore next */
    if (!nonce) {
      /* istanbul ignore next */
      logger.error(`${loggerHeader} Error creating nonce for user: ${username}`);
      /* istanbul ignore next */
      throw new GraphQLError('Error creating nonce');
    }

    logger.warn(`${loggerHeader} accessing private key for user creation: ${username}`);
    // get the private key
    const privateKey = await getAppsPrivateKey();

    /* istanbul ignore next */
    if (!privateKey) {
      /* istanbul ignore next */
      logger.error(`${loggerHeader} Error getting private key for user: ${username}`);
      /* istanbul ignore next */
      throw new GraphQLError('Error getting private key');
    }

    // sign the nonce with the private key
    const signedNonce = await encryptWithPrivateKey(privateKey, nonce);

    /* istanbul ignore next */
    if (!signedNonce) {
      /* istanbul ignore next */
      logger.error(`${loggerHeader} Error signing nonce for user: ${username}`);
      /* istanbul ignore next */
      throw new GraphQLError('Error signing nonce');
    }

    logger.warn(`${loggerHeader} User: ${username} created successfully. Generating invite token.`);
    // const signedNonce = await encryptWithPrivateKey
    const inviteToken: IAccountCompletionInviteDocument = (
      await AccountCompletionInviteModel.create({
        nonce,
        user: user._id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours
      })
    ).toObject();

    return {user, inviteToken: {token: signedNonce, expiresAt: inviteToken.expiresAt}};
  } catch (error) {
    /* istanbul ignore next */
    if (error?.toString()?.includes('E11000 duplicate key error')) {
      logger.error(`${loggerHeader} User: ${username} already exists!`);
      throw new GraphQLError('User already exists');
    } else {
      /* istanbul ignore next */
      logger.error(`${loggerHeader} Error creating user: ${error}`);
      /* istanbul ignore next */
      throw new GraphQLError('Error creating user');
    }
  }
};
