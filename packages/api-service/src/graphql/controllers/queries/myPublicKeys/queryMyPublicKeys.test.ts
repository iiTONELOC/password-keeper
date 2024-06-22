import path from 'path';
import {myPublicKeys} from '.';
import {getPathToKeyFolder, getPublicKey} from '../../../../utils';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';
import {createTestUser, TestUserCreationData} from '../../../../utils/testHelpers';
import {
  AuthContext,
  DBConnection,
  CreateUserMutationVariables,
  CompleteAccountMutationPayload
} from 'passwordkeeper.types';

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.queryMyPublicKeys')
);

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'queryMyPublicKeysTestUser',
    email: 'queryMyPublicKeysTestUser@test.com'
  }
};

let db: DBConnection;

beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('queryMyPublicKeys', () => {
  it('should be able to get the current users public keys', async () => {
    const testUserData: TestUserCreationData = await createTestUser({
      pathToKeys,
      userRSAKeyName: 'queryMyPublicKeys',
      user: testUserCreationData
    });

    // get the created auth session for the test user
    const authSession: CompleteAccountMutationPayload = testUserData.createdAuthSession;
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
    const publicKey = await getPublicKey(testUserData.userKeys.pathToPublicKey);

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
      'Error: Not Authenticated'
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
      'Error: Session Expired'
    );
  });
});
