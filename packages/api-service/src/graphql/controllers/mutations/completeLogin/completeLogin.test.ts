import path from 'path';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';
import {getPublicKey, getPathToKeyFolder, getPathToPublicKey} from '../../../../utils';
import {createTestUser, requestLoginForTestUser, loginTestUser} from '../../testHelpers';
import type {
  IUser,
  DBConnection,
  IUserDocument,
  GeneratedRSAKeys,
  CreateUserMutationVariables,
  GetLoginNonceMutationPayload
} from 'passwordkeeper.types';

// store variables needed to test the login invite process
let db: DBConnection;
let testUser: IUserDocument;
let testUserKeys: GeneratedRSAKeys;
let loginInvite: GetLoginNonceMutationPayload;

// path to the test keys
const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'test-keys'),
  'completeLogin'
);

// data to create a test user
const testUserCreationData: IUser = {
  username: 'testCompleteLogin',
  email: 'testCompleteLogin@test.com'
};

// variables to create a test user using graphql mutation
const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {username: testUserCreationData.username, email: testUserCreationData.email}
};

/**
 * Need to create a test user and keys for the login process
 */
beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');

  // get the app's public key to decrypt the nonce
  const appPublicKey: string | undefined = await getPublicKey(getPathToPublicKey());

  if (!appPublicKey) {
    throw new Error('Error getting public key');
  }

  // create a test user
  const createTestUserResult = await createTestUser({
    pathToKeys: pathToKeys,
    userRSAKeyName: 'completeLogin',
    user: {...testUserCreationVariables}
  });

  testUserKeys = createTestUserResult.userKeys;
  testUser = createTestUserResult.createdAuthSession.user as IUserDocument;

  // get the login invite
  loginInvite = await requestLoginForTestUser({
    testUser,
    testUserKeys,
    appPublicKey
  });
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('completeLogin', () => {
  it('should complete the login process and return an AuthSession', async () => {
    const loginResult = await loginTestUser({
      testUser,
      testUserKeys,
      loginInvite
    });

    expect(loginResult).toHaveProperty('_id');
    expect(loginResult).toHaveProperty('nonce');
    expect(loginResult).toHaveProperty('user');
    expect(loginResult).toHaveProperty('expiresAt');
  });
});
