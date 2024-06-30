import {AUTH_SESSION_ERROR_MESSAGES} from '../../../errors/messages';
import {AccountStatusTypes, AuthContext} from 'passwordkeeper.types';
/**
 * Note, this does not Authenticate the user, as
 * Middleware should have already done that.
 *
 * This ensures that the session has not expired and
 * double checks the account status.
 *
 * Again, this data is supplied to the context by the middleware and cannot
 * be tampered with by the user.
 * @param context - AuthContext
 * @returns
 */
export const enforceUserSession = (context: AuthContext) => {
  /* istanbul ignore next */
  const {session} = context ?? {
    session: false
  };

  // check the expiration time of the session
  const now = new Date();

  if (session?.expiresAt && session.expiresAt < now) {
    throw new Error(AUTH_SESSION_ERROR_MESSAGES.SESSION_EXPIRED);
  }

  if (!session?.user || Object.keys(session?.user).length === 0) {
    throw new Error(AUTH_SESSION_ERROR_MESSAGES.NOT_AUTHENTICATED);
  }

  // ensure the account status is valid
  if (session?.user?.account?.status !== AccountStatusTypes.ACTIVE) {
    throw new Error(
      `${AUTH_SESSION_ERROR_MESSAGES.INVALID_ACCOUNT_STATUS_FOR_AUTHENTICATION}.\n\tAccount Status:${session?.user?.account?.status}`
    );
  }

  return session;
};
