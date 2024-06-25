import {GraphQLError} from 'graphql';
import {USER_ERROR_MESSAGES} from '../../../../errors/messages';
import {createNonce, getAppsPrivateKey, encryptWithPrivateKey, logger} from '../../../../../utils';
import {
  UserModel,
  AccountModel,
  AccountTypeModel,
  AccountCompletionInviteModel
} from '../../../../../db/Models';
import {
  UserRoles,
  ValidAccountTypes,
  type IUserDocument,
  type IAccountDocument,
  type IAccountTypeDocument,
  type CreateUserMutationPayload,
  type CreateUserMutationVariables,
  type IAccountCompletionInviteDocument
} from 'passwordkeeper.types';
import {handleErrorMessages} from '../../../helpers';

export const createUser = async (
  _: undefined,
  args: CreateUserMutationVariables,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  __: undefined
): Promise<CreateUserMutationPayload> => {
  const {
    createUserArgs: {username, email, accountType}
  } = args;

  const loggerHeader = 'createUser mutation::';

  if (!username) {
    throw new GraphQLError(USER_ERROR_MESSAGES.USERNAME_REQUIRED);
  }

  if (!email) {
    throw new GraphQLError(USER_ERROR_MESSAGES.EMAIL_REQUIRED);
  }

  try {
    logger.warn(`${loggerHeader} User: ${username} requested to create an account`);
    let user: IUserDocument = (
      await UserModel.create({username, email, userRole: UserRoles.ACCOUNT_OWNER})
    )?.toObject();

    const userAccountType: IAccountTypeDocument = (
      await AccountTypeModel.findOne({
        type: accountType || ValidAccountTypes.FREE
      })
    )?.toObject() as IAccountTypeDocument;

    // create an Account for the user
    const userAccount: IAccountDocument = (
      await AccountModel.create({
        owner: user._id,
        accountType: userAccountType._id
      })
    ).toObject() as IAccountDocument;

    // update the user with the account - everyone defaults to a free account with this createUser mutation
    user = (
      await UserModel.findByIdAndUpdate(
        user._id,
        {account: userAccount._id},
        {new: true, runValidators: true}
      )
        .select('_id username email publicKeys account')
        .populate({path: 'publicKeys'})
        .populate({path: 'account', select: 'accountType', populate: {path: 'accountType'}})
    )?.toObject() as IUserDocument;

    // create a random nonce
    const nonce = createNonce();
    /* istanbul ignore next */
    if (!nonce) {
      /* istanbul ignore next */
      logger.error(`${loggerHeader} Error creating nonce for user: ${username}`);
      /* istanbul ignore next */
      throw new GraphQLError(USER_ERROR_MESSAGES.NONCE_ERROR);
    }

    logger.warn(`${loggerHeader} accessing private key for user creation: ${username}`);
    // get the private key
    const privateKey = await getAppsPrivateKey();

    /* istanbul ignore next */
    if (!privateKey) {
      /* istanbul ignore next */
      logger.error(`${loggerHeader} Error getting private key for user: ${username}`);
      /* istanbul ignore next */
      throw new GraphQLError(USER_ERROR_MESSAGES.FETCH_PRIVATE_KEY_ERROR);
    }

    // sign the nonce with the private key
    const signedNonce = await encryptWithPrivateKey(privateKey, nonce);

    /* istanbul ignore next */
    if (!signedNonce) {
      /* istanbul ignore next */
      logger.error(`${loggerHeader} Error signing nonce for user: ${username}`);
      /* istanbul ignore next */
      throw new GraphQLError(USER_ERROR_MESSAGES.SIGNING_NONCE_ERROR);
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
      throw new GraphQLError(USER_ERROR_MESSAGES.ALREADY_EXISTS);
    } else {
      /* istanbul ignore next */
      logger.error(`${loggerHeader} Error creating user: ${error}`);
      /* istanbul ignore next */
      throw new GraphQLError(
        handleErrorMessages(error as Error, USER_ERROR_MESSAGES.CREATE_USER_ERROR)
      );
    }
  }
};
