import {GraphQLError} from 'graphql';
import logger from '../../../../logger';
import type {AuthContext, QueryMeResponse} from 'passwordkeeper.types';
import {enforceUserSession} from '../../helpers/enforceUserSession';

const me = async (
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
      email: session.user.email
    };

    return sanitizedUser;
  } catch (error) {
    logger.error('Query Me:: error -', error);
    throw new GraphQLError('Error getting user');
  }
};

export {me};
