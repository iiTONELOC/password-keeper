import {GraphQLError} from 'graphql';
import {logger} from 'passwordkeeper.logger';
import {handleErrorMessages, enforceUserSession} from '../../helpers';
import type {AuthContext, QueryMeResponse} from 'passwordkeeper.types';

export const me = async (
  _: undefined,
  __: undefined,
  context: AuthContext | undefined
): Promise<QueryMeResponse> => {
  try {
    const session = enforceUserSession(context as AuthContext);

    session.user.publicKeys = [];

    const sanitizedUser: QueryMeResponse = {
      _id: session.user._id,
      username: session.user.username,
      email: session.user.email,
      account: {...session.user.account}
    };

    return sanitizedUser;
  } catch (error) {
    logger.error('Query Me:: error -', error);
    throw new GraphQLError(handleErrorMessages(error as Error));
  }
};
