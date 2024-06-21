import {GraphQLError} from 'graphql';
import {logger} from '../../../../../utils';
import {UserModel} from '../../../../../db/Models';
import {enforceUserSession, handleErrorMessages} from '../../../helpers';
import {
  AuthContext,
  UpdateUserMutationPayload,
  UpdateUserMutationVariables
} from 'passwordkeeper.types';

export const updateUser = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: undefined,
  args: UpdateUserMutationVariables,
  context: AuthContext
): Promise<UpdateUserMutationPayload> => {
  const {updateUserArgs}: UpdateUserMutationVariables = args;
  const session = enforceUserSession(context);

  if (!updateUserArgs.username && !updateUserArgs.email) {
    throw new GraphQLError('Username or email is required');
  }

  const loggerHeader = 'updateUser mutation::';

  try {
    const user = await UserModel.findOneAndUpdate(
      {_id: session.user._id},
      {...updateUserArgs},
      {new: true, runValidators: true}
    );

    if (!user) {
      throw new GraphQLError('User not found');
    }

    return {
      user: user.toObject()
    };
  } catch (error) {
    logger.error(
      `${loggerHeader} User: ${session.user.username} - ${session.user._id} - ERROR - ${error}`
    );
    throw new GraphQLError(handleErrorMessages(error as Error, 'Error updating user'));
  }
};
