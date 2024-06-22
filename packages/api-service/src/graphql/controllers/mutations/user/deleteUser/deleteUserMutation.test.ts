import path from 'path';
import {deleteUser} from '.';
import {getAuth} from '../../../../../middleware';
import {getPathToKeyFolder} from '../../../../../utils';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../../db/connection';
import {
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware
} from '../../../../../utils/testHelpers';
import {
  DBConnection,
  IAuthSessionDocument,
  CreateUserMutationVariables,
  CompleteAccountMutationPayload
} from 'passwordkeeper.types';
import {
  AccountCompletionInviteModel,
  AccountModel,
  AuthSessionModel,
  EncryptedUserPasswordModel,
  PublicKeyModel,
  UserModel
} from '../../../../../db/Models';
import LoginInvite from '../../../../../db/Models/LoginInvite';

const pathToKeys: string = path.normalize(getPathToKeyFolder()?.replace('.private', '.deleteUser'));

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'deleteUserTestUser',
    email: 'deleteUserTestUser@test.com'
  }
};

let db: DBConnection;
let testUserData: TestUserCreationData;
let authSession: CompleteAccountMutationPayload;
let sessionId: string;
let signature: string;

let testUser2Data: TestUserCreationData;
let authSession2: CompleteAccountMutationPayload;
let sessionId2: string;
let signature2: string;

beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');
  testUserData = await createTestUser({
    pathToKeys,
    userRSAKeyName: 'deleteUser',
    user: testUserCreationData
  });

  // create a second user to test the delete user mutation
  testUser2Data = await createTestUser({
    pathToKeys: pathToKeys.replace('.deleteUser', '.deleteUser1'),
    userRSAKeyName: 'deleteUser1',
    user: {
      createUserArgs: {
        username: 'deleteUserTestUser1',
        email: 'deleteTestUser1@test.com'
      }
    }
  });

  // get the created auth session for the test user
  authSession = testUserData.createdAuthSession;
  const sessionData = await getSessionReadyForAuthMiddleware({
    testUserData,
    authSession,
    keyName: 'deleteUser'
  });
  sessionId = sessionData.sessionId as string;
  signature = sessionData.signature as string;

  // get the created auth session for the second test user
  authSession2 = testUser2Data.createdAuthSession;
  const sessionData2 = await getSessionReadyForAuthMiddleware({
    testUserData: testUser2Data,
    authSession: authSession2,
    keyName: 'deleteUser1'
  });
  sessionId2 = sessionData2.sessionId as string;
  signature2 = sessionData2.signature as string;
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('deleteUser', () => {
  it('should delete a user', async () => {
    // @ts-expect-error - testing  do not need a real req obj
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });
    const result = await deleteUser(undefined, undefined, {session: validSession});

    expect(result).toBeDefined();
    expect(result.username).toBe(testUserData.createdAuthSession.user.username);

    expect.assertions(2);
  });

  it('should throw an error if no user is found', async () => {
    // @ts-expect-error - testing  do not need a real req obj
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {}
    });

    await deleteUser(undefined, undefined, {session: validSession}).catch(error => {
      expect(error.message).toBe('Not Authenticated');
    });

    expect.assertions(1);
  });

  it("should delete the user's associated data", async () => {
    // @ts-expect-error - testing  do not need a real req obj
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId2, signature: signature2}
    });
    const result = await deleteUser(undefined, undefined, {session: validSession});

    expect(result).toBeDefined();
    expect(result.username).toBe(testUser2Data.createdAuthSession.user.username);

    // all their passwords should be deleted
    const usersPasswords = await EncryptedUserPasswordModel.find({owner: result._id});
    expect(usersPasswords).toHaveLength(0);

    // all their public keys should be deleted
    const usersPublicKeys = await PublicKeyModel.find({owner: result._id});
    expect(usersPublicKeys).toHaveLength(0);

    // all their auth sessions should be deleted
    const usersAuthSessions = await AuthSessionModel.find({user: result._id});
    expect(usersAuthSessions).toHaveLength(0);

    // all their login invites should be deleted
    const usersLoginInvites = await LoginInvite.find({user: result._id});
    expect(usersLoginInvites).toHaveLength(0);

    // all their account completion invites should be deleted
    const usersAccountCompletionInvites = await AccountCompletionInviteModel.find({
      user: result._id
    });
    expect(usersAccountCompletionInvites).toHaveLength(0);

    // all their sub-users should be deleted
    const usersSubUsers = await UserModel.find({owner: result._id});
    expect(usersSubUsers).toHaveLength(0);

    // the account should remain, it should be set to DELETED
    // and its sub-users, passwords, and public keys should all have a length of 0
    const account = await AccountModel.findOne({owner: result._id});

    expect(account).toBeDefined();
    expect(account?.status).toBe('DELETED');
    expect(account?.subUsers).toHaveLength(0);
    expect(account?.passwords).toHaveLength(0);
    expect(account?.publicKeys).toHaveLength(0);

    expect.assertions(13);
  });
});
