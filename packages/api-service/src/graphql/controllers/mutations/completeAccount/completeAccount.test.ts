import path from 'path';
import {getPathToKeyFolder} from '../../../../utils';
import {createTestUser} from '../../../../testHelpers';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';
import {DBConnection, CreateUserMutationVariables} from 'passwordkeeper.types';
import {AccountCompletionInviteModel} from '../../../../db/Models';

const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'test-keys'),
  'completeAccount'
);

let db: DBConnection;

beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('completeAccount', () => {
  it('should complete the account creation process', async () => {
    const testUserCreationData: CreateUserMutationVariables = {
      createUserArgs: {
        username: 'completeAccountTestUser',
        email: 'completeAccountTestUser@test.com'
      }
    };

    // create a test user
    const newUser = await createTestUser({
      pathToKeys,
      userRSAKeyName: 'completeAccount',
      user: testUserCreationData
    });

    // get the created auth session for the test user
    const result = newUser.createdAuthSession;

    // check the result should have a _id, nonce, user, and expiresAt
    expect(result).toBeDefined();
    expect(result._id).toBeDefined();
    expect(result.nonce).toBeDefined();
    expect(result.user).toBeDefined();

    // the user should have an _id, username, and email and they should match the user created
    expect(result.user._id).toBeDefined();
    expect(result.user.username).toBe(testUserCreationData.createUserArgs.username);
    expect(result.user.email).toBe(testUserCreationData.createUserArgs.email);

    // the expiresAt should be a date
    expect(result.expiresAt).toBeDefined();
    expect(result.expiresAt).toBeInstanceOf(Date);

    // the invite should be deleted from the database
    expect(
      await AccountCompletionInviteModel.find({user: newUser.createdAuthSession.user._id})
    ).toHaveLength(0);

    expect.assertions(10);
  });
});
