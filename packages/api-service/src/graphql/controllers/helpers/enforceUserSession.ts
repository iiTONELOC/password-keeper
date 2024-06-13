import {AuthContext} from 'passwordkeeper.types';

export const enforceUserSession = (context: AuthContext) => {
  const {session} = context ?? {
    session: false
  };

  if (!session) {
    throw new Error('Not Authenticated');
  }

  if (!session?.user) {
    throw new Error('Not Authenticated');
  }

  return session;
};
