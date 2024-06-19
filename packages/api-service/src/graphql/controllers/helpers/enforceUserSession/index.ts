import {AuthContext} from 'passwordkeeper.types';

const NOT_AUTHENTICATED = 'Not Authenticated';

export const enforceUserSession = (context: AuthContext) => {
  /* istanbul ignore next */
  const {session} = context ?? {
    session: false
  };

  // check the expiration time of the session
  const now = new Date();

  if (session?.expiresAt && session.expiresAt < now) {
    throw new Error('Session Expired');
  }

  if (!session) {
    throw new Error(NOT_AUTHENTICATED);
  }

  if (!session?.user) {
    throw new Error(NOT_AUTHENTICATED);
  }

  if (!session.user || Object.keys(session.user).length === 0) {
    throw new Error(NOT_AUTHENTICATED);
  }

  return session;
};
