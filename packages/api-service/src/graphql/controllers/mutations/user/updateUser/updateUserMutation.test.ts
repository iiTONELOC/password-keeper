import path from 'path';
import {updateUser} from '.';
import {getPathToKeyFolder} from '../../../../../utils';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../../db/connection';
import {
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware
} from '../../../../../utils/testHelpers';
import {
  IUser,
  UserRoles,
  DBConnection,
  IAuthSessionDocument,
  CreateUserMutationVariables,
  CompleteAccountMutationPayload,
  UpdateUserMutationPayload
} from 'passwordkeeper.types';
import {getAuth} from '../../../../../middleware';
import {UserModel} from '../../../../../db/Models';

const testUserCreationData: IUser = {
  username: 'updateUserTest',
  email: 'updateUserTest@test.com',
  userRole: UserRoles.ACCOUNT_OWNER
};

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.updateUserTest')
);

const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {username: testUserCreationData.username, email: testUserCreationData.email}
};

let db: DBConnection;
let testUserData: TestUserCreationData;
let authSession: CompleteAccountMutationPayload;
let validSession: IAuthSessionDocument | undefined;

beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');
  testUserData = await createTestUser({
    pathToKeys,
    userRSAKeyName: 'updateUserTest',
    user: testUserCreationVariables
  });

  // get the created auth session for the test user
  authSession = testUserData.createdAuthSession;
  const sessionData = await getSessionReadyForAuthMiddleware({
    testUserData,
    authSession,
    keyName: 'updateUserTest'
  });

  await UserModel.create({
    username: `${testUserCreationData.username}2`,
    email: `${testUserCreationData.email}2`,
    userRole: UserRoles.ACCOUNT_OWNER
  });

  // @ts-expect-error - we are testing and don't need to pass in a real request
  validSession = await getAuth({
    headers: {authorization: sessionData.sessionId, signature: sessionData.signature}
  });
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('updateUser', () => {
  it("should update a user's username", async () => {
    const result: UpdateUserMutationPayload = await updateUser(
      undefined,
      {updateUserArgs: {username: 'updatedUsername'}},
      {session: validSession as IAuthSessionDocument}
    );

    expect(result).toBeDefined();
    expect(result.user.username).toBe('updatedUsername');
    expect(result.user.email).toBe(testUserCreationData.email);

    expect.assertions(3);
  });

  it("should update a user's email", async () => {
    const result: UpdateUserMutationPayload = await updateUser(
      undefined,
      {updateUserArgs: {email: 'updatedEmail@test.com'}},
      {session: validSession as IAuthSessionDocument}
    );

    expect(result).toBeDefined();
    expect(result.user.username).toBe('updatedUsername');
    expect(result.user.email).toBe('updatedEmail@test.com');

    expect.assertions(3);
  });

  it('should enforce unique username', async () => {
    try {
      const updated = await updateUser(
        undefined,
        {updateUserArgs: {username: 'updateUserTest2'}},
        {session: validSession as IAuthSessionDocument}
      );

      console.log('SHOULD NOT SEE THIS:\n', updated);
    } catch (error) {
      expect(String(error)).toBe(
        'MongoServerError: Plan executor error during findAndModify :: caused by :: E11000 duplicate key error collection: pwd-keeper-test.users index: username_1 dup key: { username: "updateUserTest2" }'
      );
    }

    expect.assertions(1);
  });

  it('should enforce unique email', async () => {
    try {
      const updated = await updateUser(
        undefined,
        {updateUserArgs: {email: 'updateUserTest@test.com2'}},
        {session: validSession as IAuthSessionDocument}
      );

      console.log('SHOULD NOT SEE THIS:\n', updated);
    } catch (error) {
      expect(String(error)).toBe(
        'MongoServerError: Plan executor error during findAndModify :: caused by :: E11000 duplicate key error collection: pwd-keeper-test.users index: email_1 dup key: { email: "updateUserTest@test.com2" }'
      );
    }
  });

  it('should throw an error if no username or email is provided', async () => {
    try {
      const updated = await updateUser(
        undefined,
        {updateUserArgs: {}},
        {session: validSession as IAuthSessionDocument}
      );

      console.log('SHOULD NOT SEE THIS:\n', updated);
    } catch (error) {
      expect(String(error)).toBe('Username or email is required');
    }

    expect.assertions(1);
  });

  it('should throw an error if the user is not found', async () => {
    try {
      // @ts-expect-error - we are testing
      validSession?.user = undefined;

      const updated = await updateUser(
        undefined,
        {updateUserArgs: {username: 'notFound'}},
        {session: validSession as IAuthSessionDocument}
      );

      console.log('SHOULD NOT SEE THIS:\n', updated);
    } catch (error) {
      expect(String(error)).toBe('Error: Not Authenticated');
    }

    expect.assertions(1);
  });
});
