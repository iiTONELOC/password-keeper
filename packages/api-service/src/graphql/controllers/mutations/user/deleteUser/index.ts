import {GraphQLError} from 'graphql';
import {logger} from '../../../../../utils';
import {enforceUserSession, handleErrorMessages} from '../../../helpers';
import {AccountStatusTypes, AuthContext, IUserDocument, UserRoles} from 'passwordkeeper.types';
import {
  UserModel,
  AccountModel,
  PublicKeyModel,
  AuthSessionModel,
  LoginInviteModel,
  EncryptedUserPasswordModel,
  AccountCompletionInviteModel
} from '../../../../../db/Models';

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
    console.log('session.user.userRole', session.user.userRole);
    if (session.user.userRole === UserRoles.ACCOUNT_OWNER) {
      // remove the sub-users
      await UserModel.deleteMany({_id: {$in: session.user.subUsers}});

      // remove the data from the account and set it to DELETED
      // TODO: maybe this should be a soft delete for a certain period of time?
      //       so users can recover their account if they accidentally delete it
      await AccountModel.findOneAndUpdate(
        {owner: session.user._id},
        {
          $set: {
            status: AccountStatusTypes.DELETED,
            passwords: [],
            publicKeys: [],
            subUsers: []
          }
        }
      );
    }

    // remove everyone's passwords
    await EncryptedUserPasswordModel.deleteMany({
      _id: {$in: [...(session?.user?.subUsers ?? []), session.user._id]}
    });
    // remove everyone's public keys
    await PublicKeyModel.deleteMany({
      owner: {$in: [...(session?.user?.subUsers ?? []), session.user._id]}
    });
    // remove everyone's auth sessions
    await AuthSessionModel.deleteMany({
      user: {$in: [...(session?.user?.subUsers ?? []), session.user._id]}
    });
    // remove everyone's login invites
    await LoginInviteModel.deleteMany({
      user: {$in: [...(session?.user?.subUsers ?? []), session.user._id]}
    });
    // remove any pending account completion invites
    await AccountCompletionInviteModel.deleteMany({
      user: {$in: [...(session?.user?.subUsers ?? []), session.user._id]}
    });

    if (!user) {
      throw new GraphQLError('User not found');
    }
    return session.user;
  } catch (error) {
    logger.error(
      `${loggerHeader} User: ${session.user.username} - ${session.user._id} - ERROR - ${error}`
    );
    throw new GraphQLError(handleErrorMessages(error as Error, 'Error deleting user'));
  }
};
