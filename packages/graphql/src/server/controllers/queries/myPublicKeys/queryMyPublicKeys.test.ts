import path from 'path';
import {myPublicKeys} from '.';
import {getPathToKeyFolder} from 'passwordkeeper.crypto';
import {createTestUser} from '../../../utils/testHelpers';
import {AUTH_SESSION_ERROR_MESSAGES} from '../../../errors/messages';
import {connectToDB, disconnectFromDB} from 'passwordkeeper.database';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {
  AuthContext,
  DBConnection,
  CreateUserMutationVariables,
  CreateUserMutationPayload
} from 'passwordkeeper.types';

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.queryMyPublicKeys')
);

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'queryMyPublicKeys',
    email: 'queryMyPublicKeys@test.com',
    publicKey: ''
  }
};

let db: DBConnection;

beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('queryMyPublicKeys', () => {
  it('should be able to get the current users public keys', async () => {
    const authSession: CreateUserMutationPayload = await createTestUser({
      pathToKeys,
      userRSAKeyName: 'queryMyPublicKeys',
      user: testUserCreationData
    });

    const authContext: AuthContext = {
      session: {
        //@ts-expect-error - mock data for testing purposes
        _id: 'sessionId',
        //@ts-expect-error - mock data for testing purposes
        user: authSession.user,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      }
    };

    const result = await myPublicKeys(undefined, undefined, authContext);

    const publicKey = authSession?.user?.publicKeys?.[0]?.key as string;

    expect(result).toEqual([
      {
        //expect any _id
        _id: result[0]._id,
        expiresAt: expect.any(Date),
        key: publicKey?.trim()
      }
    ]);
  });

  it('should throw an error if the user is not authenticated', async () => {
    const authContext: AuthContext = {
      session: {
        //@ts-expect-error - mock data for testing purposes
        _id: 'sessionId',
        //@ts-expect-error - mock data for testing purposes
        user: {},
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      }
    };

    await expect(myPublicKeys(undefined, undefined, authContext)).rejects.toThrow(
      AUTH_SESSION_ERROR_MESSAGES.NOT_AUTHENTICATED
    );
  });

  it('should throw an error if the session is expired', async () => {
    const authContext: AuthContext = {
      session: {
        //@ts-expect-error - mock data for testing purposes
        _id: 'sessionId',
        //@ts-expect-error - mock data for testing purposes
        user: {},
        expiresAt: new Date(Date.now() - 1000)
      }
    };

    await expect(myPublicKeys(undefined, undefined, authContext)).rejects.toThrow(
      AUTH_SESSION_ERROR_MESSAGES.SESSION_EXPIRED
    );
  });
});
