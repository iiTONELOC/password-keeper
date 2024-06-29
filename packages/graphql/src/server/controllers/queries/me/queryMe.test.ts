import {me} from '.';
import path from 'path';
import {getPathToKeyFolder} from 'passwordkeeper.crypto';
import {AUTH_SESSION_ERROR_MESSAGES} from '../../../errors/messages';
import {connectToDB, disconnectFromDB} from 'passwordkeeper.database';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {createTestUser, TestUserCreationData} from '../../../utils/testHelpers';
import {
  AuthContext,
  DBConnection,
  QueryMeResponse,
  CreateUserMutationVariables,
  CompleteAccountMutationPayload
} from 'passwordkeeper.types';

const pathToKeys: string = path.normalize(getPathToKeyFolder()?.replace('.private', '.queryMe'));

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'queryMeTestUser',
    email: 'queryMeTestUser@test.com'
  }
};

let db: DBConnection;
let testUserData: TestUserCreationData;
let authSession: CompleteAccountMutationPayload;

beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');
  testUserData = await createTestUser({
    pathToKeys,
    userRSAKeyName: 'queryMe',
    user: testUserCreationData
  });

  // get the created auth session for the test user
  authSession = testUserData.createdAuthSession;
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('queryMe', () => {
  it('should be able to get the current user', async () => {
    const authContext: AuthContext = {
      session: {
        //@ts-expect-error - mock data for testing purposes
        _id: 'sessionId',
        //@ts-expect-error - mock data for testing purposes
        user: authSession.user,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      }
    };

    const result: QueryMeResponse = await me(undefined, undefined, authContext);

    expect(result).toEqual({
      _id: authSession.user._id,
      username: authSession.user.username,
      email: authSession.user.email,
      account: {...authSession.user.account}
    });
  });

  it('should throw an error if the session is expired', async () => {
    const authContext: AuthContext = {
      session: {
        //@ts-expect-error - mock data for testing purposes
        _id: 'sessionId',
        //@ts-expect-error - mock data for testing purposes
        user: authSession.user,
        expiresAt: new Date(Date.now() - 1000)
      }
    };

    await expect(me(undefined, undefined, authContext)).rejects.toThrowError(
      AUTH_SESSION_ERROR_MESSAGES.SESSION_EXPIRED
    );
  });

  it('Should throw an error if the user is not found', async () => {
    const authContext: AuthContext = {
      session: {
        //@ts-expect-error - mock data for testing purposes
        _id: 'sessionId',
        //@ts-expect-error - mock data for testing purposes
        user: {},
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      }
    };

    await expect(me(undefined, undefined, authContext)).rejects.toThrowError(
      AUTH_SESSION_ERROR_MESSAGES.NOT_AUTHENTICATED
    );
  });
});
