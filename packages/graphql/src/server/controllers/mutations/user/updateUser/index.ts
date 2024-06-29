import {GraphQLError} from 'graphql';
import {logger} from 'passwordkeeper.logger';
import {UserModel} from 'passwordkeeper.database';
import {USER_ERROR_MESSAGES} from '../../../../errors/messages';
import {enforceUserSession, handleErrorMessages} from '../../../helpers';
import {
  AuthContext,
  IUserDocument,
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
    const user = (
      await UserModel.findByIdAndUpdate(
        {_id: session.user._id},
        {...updateUserArgs},
        {new: true, runValidators: true}
      ).select('_id username email')
    )?.toObject();

    if (!user) {
      throw new GraphQLError(USER_ERROR_MESSAGES.NOT_FOUND);
    }

    return {...user} as IUserDocument;
  } catch (error) {
    logger.error(
      `${loggerHeader} User: ${session.user.username} - ${session.user._id} - ERROR - ${error}`
    );
    throw new GraphQLError(handleErrorMessages(error as Error, USER_ERROR_MESSAGES.UPDATE_ERROR));
  }
};
