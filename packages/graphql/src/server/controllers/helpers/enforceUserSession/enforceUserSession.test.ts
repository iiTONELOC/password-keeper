import {enforceUserSession} from './';
import {describe, it} from '@jest/globals';
import {AUTH_SESSION_ERROR_MESSAGES} from '../../../errors/messages';
import {AuthContext, IAuthSessionDocument} from 'passwordkeeper.types';

const fakeAuthSession: IAuthSessionDocument = {
  // @ts-expect-error - testing purposes only
  _id: 'fakeId',
  expiresAt: new Date('2022-01-01'),
  user: {
    // @ts-expect-error - testing purposes only
    _id: 'fakeUserId',
    username: 'fakeUsername',
    email: 'fakeEmail'
  }
};

describe('enforceUserSession', () => {
  it('should throw an error if the session is expired', () => {
    const context: AuthContext = {
      // @ts-expect-error - testing purposes only
      session: {
        ...fakeAuthSession,
        expiresAt: new Date('2020-01-01')
      }
    };

    expect(() => enforceUserSession(context)).toThrow(AUTH_SESSION_ERROR_MESSAGES.SESSION_EXPIRED);
  });

  it('should throw an error if the session is not authenticated', () => {
    const context: AuthContext = {
      // @ts-expect-error - testing purposes only
      session: undefined
    };

    expect(() => enforceUserSession(context)).toThrow(
      AUTH_SESSION_ERROR_MESSAGES.NOT_AUTHENTICATED
    );
  });

  it('should throw an error if the session does not have a user but is not expired', () => {
    const context: AuthContext = {
      session: {
        ...fakeAuthSession,
        // 10 minutes from now
        expiresAt: new Date(Date.now() + 600000),
        // @ts-expect-error - testing purposes only
        user: undefined
      }
    };

    expect(() => enforceUserSession(context)).toThrow(
      AUTH_SESSION_ERROR_MESSAGES.NOT_AUTHENTICATED
    );
  });

  it('should return the session if it is not expired and has a user', () => {
    const context: AuthContext = {
      session: {
        user: {
          // @ts-expect-error - testing purposes only
          _id: 'fakeUserId',
          username: 'fakeUsername',
          account: {
            // @ts-expect-error - testing purposes only
            accountType: 'fakeAccountType',
            // @ts-expect-error - testing purposes only
            status: 'ACTIVE'
          }
        },
        // 10 minutes from now
        expiresAt: new Date(Date.now() + 600000)
      }
    };

    expect(enforceUserSession(context)).toEqual(context.session);
  });
});
