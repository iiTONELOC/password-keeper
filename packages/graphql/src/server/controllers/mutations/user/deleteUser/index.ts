import {GraphQLError} from 'graphql';
import {logger} from 'passwordkeeper.logger';
import {USER_ERROR_MESSAGES} from '../../../../errors/messages';
import {enforceUserSession, handleErrorMessages} from '../../../helpers';
import {AccountStatusTypes, AuthContext, IUserDocument, UserRoles} from 'passwordkeeper.types';
import {
  UserModel,
  AccountModel,
  PublicKeyModel,
  AuthSessionModel,
  LoginInviteModel,
  EncryptedUserPasswordModel
} from 'passwordkeeper.database';

export const deleteUser = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: undefined,
  __: undefined,
  context: AuthContext
): Promise<IUserDocument> => {
  const session = enforceUserSession(context);

  const loggerHeader = 'deleteUser mutation::';

  try {
    // delete the user
    const user = await UserModel.deleteOne({_id: session.user._id});
    // if the user is an account owner, delete the passwords and sub-users and public keys
    // from the account and set the account to DELETED
    if (session.user.userRole === UserRoles.ACCOUNT_OWNER) {
      // remove the sub-users
      const removeSubUsersPromise = UserModel.deleteMany({_id: {$in: session.user.subUsers}});

      const updateAccountPromise = AccountModel.findOneAndUpdate(
        {owner: session.user._id},
        {
          $set: {
            subUsers: [],
            passwords: [],
            publicKeys: [],
            deletedAt: new Date(),
            status: AccountStatusTypes.DELETED
          }
        }
      );

      await Promise.all([removeSubUsersPromise, updateAccountPromise]);
    }

    // remove everyone's passwords
    const removePasswordsPromise = EncryptedUserPasswordModel.deleteMany({
      _id: {$in: [...(session?.user?.subUsers ?? []), session.user._id]}
    });
    // remove everyone's public keys
    const removePublicKeysPromise = PublicKeyModel.deleteMany({
      owner: {$in: [...(session?.user?.subUsers ?? []), session.user._id]}
    });
    // remove everyone's auth sessions
    const removeAuthSessionsPromise = AuthSessionModel.deleteMany({
      user: {$in: [...(session?.user?.subUsers ?? []), session.user._id]}
    });
    // remove everyone's login invites
    const removeLoginInvitesPromise = LoginInviteModel.deleteMany({
      user: {$in: [...(session?.user?.subUsers ?? []), session.user._id]}
    });

    await Promise.all([
      removePasswordsPromise,
      removePublicKeysPromise,
      removeAuthSessionsPromise,
      removeLoginInvitesPromise
    ]);

    if (!user) {
      throw new GraphQLError(USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return session.user;
  } catch (error) {
    logger.error(
      `${loggerHeader} User: ${session.user.username} - ${session.user._id} - ERROR - ${error}`
    );
    throw new GraphQLError(
      handleErrorMessages(error as Error, USER_ERROR_MESSAGES.DELETE_USER_ERROR)
    );
  }
};
