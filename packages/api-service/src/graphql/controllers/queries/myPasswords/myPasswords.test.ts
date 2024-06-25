import path from 'path';
import {Types} from 'mongoose';
import {myPasswords} from '.';
import {addPassword} from '../../mutations';
import {getAuth} from '../../../../middleware';
import {getPathToKeyFolder} from '../../../../utils';
import {encryptAES} from '../../../../utils/crypto/aes-256';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';
import {
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware
} from '../../../../utils/testHelpers';
import {
  IPassword,
  DBConnection,
  IAuthSessionDocument,
  CreateUserMutationVariables,
  AddPasswordMutationVariables,
  CompleteAccountMutationPayload,
  QueryMyPasswordsResponse
} from 'passwordkeeper.types';

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.queryMyPasswords')
);

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'queryMyPasswordsTestUser',
    email: 'queryMyPasswordsTestUser@test.com'
  }
};

let db: DBConnection;
let testUserData: TestUserCreationData;
let authSession: CompleteAccountMutationPayload;
let sessionId: string;
let signature: string;

const testAESKey = 'queryMyPasswordsTestAESKey';

beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');
  testUserData = await createTestUser({
    pathToKeys,
    userRSAKeyName: 'queryMyPasswords',
    user: testUserCreationData
  });

  // get the created auth session for the test user
  authSession = testUserData.createdAuthSession;
  const sessionData = await getSessionReadyForAuthMiddleware({
    testUserData,
    authSession,
    keyName: 'queryMyPasswords'
  });
  sessionId = sessionData.sessionId as string;
  signature = sessionData.signature as string;

  const passwordData: IPassword = {
    url: 'https://www.test.com',
    name: 'test',
    username: 'test',
    password: 'test',
    owner: testUserData.createdAuthSession.user._id as Types.ObjectId
  };

  // create 3 passwords, adding an index to each field to make them unique
  for (let i = 0; i < 3; i++) {
    await Promise.all([
      encryptAES(passwordData.url as string, testAESKey),
      encryptAES(`${passwordData.name}${i}`, testAESKey),
      encryptAES(`${passwordData.username}${i}`, testAESKey),
      encryptAES(`${passwordData.password}${i}`, testAESKey)
    ]).then(async ([encryptedUrl, encryptedName, encryptedUsername, encryptedPassword]) => {
      const addPasswordData: AddPasswordMutationVariables = {
        addPasswordArgs: {
          url: {...encryptedUrl},
          name: {...encryptedName},
          username: {...encryptedUsername},
          password: {...encryptedPassword}
        }
      };
      // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
      const validSession: IAuthSessionDocument = await getAuth({
        headers: {authorization: sessionId, signature}
      });

      await addPassword(undefined, addPasswordData, {session: validSession});
    });
  }
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('queryMyPasswords', () => {
  it("should retrieve the user's passwords", async () => {
    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const passwords: QueryMyPasswordsResponse = await myPasswords(undefined, undefined, {
      session: validSession
    });

    expect(passwords).toHaveLength(3);
  });

  it('should throw an error if the user is not authenticated', async () => {
    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    const invalidSession = await getAuth({headers: {authorization: 'invalidSessionId', signature}});
    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    await expect(myPasswords(undefined, undefined, {session: invalidSession})).rejects.toThrow();
  });
});
