import {AuthContext} from 'passwordkeeper.types';

export const enforceUserSession = (context: AuthContext) => {
  const {session} = context ?? {
    session: false
  };

  // check the expiration time of the session
  const now = new Date();

  if (session?.expiresAt && session.expiresAt < now) {
    throw new Error('Session Expired');
  }

  if (!session) {
    throw new Error('Not Authenticated');
  }

  if (!session?.user) {
    throw new Error('Not Authenticated');
  }

  return session;
};
