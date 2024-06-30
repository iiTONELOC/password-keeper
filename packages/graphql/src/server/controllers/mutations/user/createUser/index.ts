import {GraphQLError} from 'graphql';
import {logger} from 'passwordkeeper.logger';
import {USER_ERROR_MESSAGES} from '../../../../errors/messages';
import {UserModel, AccountModel, AccountTypeModel} from 'passwordkeeper.database';
import {handleErrorMessages, addPublicKey, createAuthSession} from '../../../helpers';
import {
  UserRoles,
  ValidAccountTypes,
  AccountStatusTypes,
  type IUserDocument,
  type IAccountDocument,
  type IAccountTypeDocument,
  type CreateUserMutationPayload,
  type CreateUserMutationVariables
} from 'passwordkeeper.types';
import {Types} from 'mongoose';

export const createUser = async (
  _: undefined,
  args: CreateUserMutationVariables,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  __: undefined
): Promise<CreateUserMutationPayload> => {
  const {
    createUserArgs: {username, email, accountType, publicKey}
  } = args;

  const loggerHeader = 'createUser mutation::';

  if (!username) {
    throw new GraphQLError(USER_ERROR_MESSAGES.USERNAME_REQUIRED);
  }

  if (!email) {
    throw new GraphQLError(USER_ERROR_MESSAGES.EMAIL_REQUIRED);
  }

  if (!publicKey) {
    throw new GraphQLError(USER_ERROR_MESSAGES.MISSING_PUBLIC_KEY);
  }

  try {
    logger.warn(`${loggerHeader} User: ${username} requested to create an account`);

    let user: IUserDocument | undefined | null = (
      await UserModel.create({username, email, userRole: UserRoles.ACCOUNT_OWNER})
    )?.toObject();

    const userAccountType: IAccountTypeDocument | undefined | null = (
      await AccountTypeModel.findOne({
        type: accountType || ValidAccountTypes.FREE
      })
    )?.toObject();

    // create an Account for the user
    const userAccount: IAccountDocument | undefined | null = (
      await AccountModel.create({
        owner: user._id,
        accountType: userAccountType?._id,
        status: AccountStatusTypes.ACTIVE
      })
    ).toObject();

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
    )?.toObject();

    // create a public key for the user
    const updatedUserData = await addPublicKey({userId: user?._id as Types.ObjectId, publicKey});

    // create an auth session for the created user
    return createAuthSession({publicKey, user: updatedUserData.user as Partial<IUserDocument>});
  } catch (error) {
    /* istanbul ignore next */
    if (error?.toString()?.includes('E11000 duplicate key error')) {
      logger.error(`${loggerHeader} User: ${username} already exists!`);
      throw new GraphQLError(USER_ERROR_MESSAGES.ALREADY_EXISTS);
    } else {
      /* istanbul ignore next */
      logger.error(`${loggerHeader} Error creating user: ${error}`);
      console.error(error);
      /* istanbul ignore next */
      throw new GraphQLError(
        handleErrorMessages(error as Error, USER_ERROR_MESSAGES.CREATE_USER_ERROR)
      );
    }
  }
};
