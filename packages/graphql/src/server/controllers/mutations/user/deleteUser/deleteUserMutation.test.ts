import path from 'path';
import {deleteUser} from '.';
import {getAuth} from '../../../../middleware';
import {getPathToKeyFolder} from 'passwordkeeper.crypto';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {
  UserModel,
  connectToDB,
  AccountModel,
  PublicKeyModel,
  AuthSessionModel,
  disconnectFromDB,
  LoginInviteModel,
  EncryptedUserPasswordModel
} from 'passwordkeeper.database';
import {createTestUser, getSessionReadyForAuthMiddleware} from '../../../../utils/testHelpers';
import {
  DBConnection,
  IAuthSessionDocument,
  CreateUserMutationVariables,
  CompleteLoginMutationPayload,
  CreateUserMutationPayload
} from 'passwordkeeper.types';

const pathToKeys: string = path.normalize(getPathToKeyFolder()?.replace('.private', '.deleteUser'));

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'deleteUser',
    email: 'deleteUser@test.com',
    publicKey: ''
  }
};

let db: DBConnection;
let testUserData: CreateUserMutationPayload;
let authSession: CompleteLoginMutationPayload;
let sessionId: string;
let signature: string;

let testUser2Data: CreateUserMutationPayload;
let authSession2: CompleteLoginMutationPayload;
let sessionId2: string;
let signature2: string;

beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');
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
        username: 'deleteUser1',
        email: 'deleteUser1@test.com'
      }
    }
  });

  // get the created auth session for the test user
  authSession = testUserData;
  const sessionData = await getSessionReadyForAuthMiddleware({
    authSession,
    keyName: 'deleteUser'
  });
  sessionId = sessionData.sessionId as string;
  signature = sessionData.signature as string;

  // get the created auth session for the second test user
  authSession2 = testUser2Data;
  const sessionData2 = await getSessionReadyForAuthMiddleware({
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
    expect(result.username).toBe(testUserData.user.username);

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

    const usersSubUsersPromise = UserModel.find({owner: result._id});
    const accountPromise = AccountModel.findOne({owner: result._id});
    const usersLoginInvitesPromise = LoginInviteModel.find({user: result._id});
    const usersPublicKeysPromise = PublicKeyModel.find({owner: result._id});
    const usersAuthSessionsPromise = AuthSessionModel.find({user: result._id});
    const usersPasswordsPromise = EncryptedUserPasswordModel.find({owner: result._id});

    const [
      usersPasswords,
      usersPublicKeys,
      usersAuthSessions,
      usersLoginInvites,
      usersSubUsers,
      account
    ] = await Promise.all([
      usersPasswordsPromise,
      usersPublicKeysPromise,
      usersAuthSessionsPromise,
      usersLoginInvitesPromise,
      usersSubUsersPromise,
      accountPromise
    ]);

    expect(result).toBeDefined();
    expect(result.username).toBe(testUser2Data.user.username);

    expect(usersPasswords).toHaveLength(0);
    expect(usersPublicKeys).toHaveLength(0);
    expect(usersAuthSessions).toHaveLength(0);
    expect(usersLoginInvites).toHaveLength(0);
    expect(usersSubUsers).toHaveLength(0);

    expect(account).toBeDefined();
    expect(account?.status).toBe('DELETED');
    expect(account?.subUsers).toHaveLength(0);
    expect(account?.passwords).toHaveLength(0);
    expect(account?.publicKeys).toHaveLength(0);
    expect(account?.deletedAt).toBeDefined();
    expect(account?.deletedAt).toBeInstanceOf(Date);
    expect(account?.deletedAt?.getUTCDate()).toBeLessThanOrEqual(new Date().getUTCDate());

    expect.assertions(15);
  });
});
