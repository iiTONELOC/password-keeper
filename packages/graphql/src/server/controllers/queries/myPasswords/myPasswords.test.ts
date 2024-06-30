import path from 'path';
import {Types} from 'mongoose';
import {myPasswords} from '.';
import {addPassword} from '../../mutations';
import {getAuth} from '../../../middleware';
import {encryptAES, getPathToKeyFolder} from 'passwordkeeper.crypto';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {connectToDB, disconnectFromDB} from 'passwordkeeper.database';
import {createTestUser, getSessionReadyForAuthMiddleware} from '../../../utils/testHelpers';
import {
  IPassword,
  DBConnection,
  IAuthSessionDocument,
  QueryMyPasswordsResponse,
  CreateUserMutationVariables,
  AddPasswordMutationVariables,
  CreateUserMutationPayload
} from 'passwordkeeper.types';

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.queryMyPasswords')
);

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'queryMyPasswords',
    email: 'queryMyPasswords@test.com',
    publicKey: ''
  }
};

let db: DBConnection;
let sessionId: string;
let signature: string;
let authSession: CreateUserMutationPayload;

const testAESKey = 'queryMyPasswordsTestAESKey';

beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');
  authSession = await createTestUser({
    pathToKeys,
    userRSAKeyName: 'queryMyPasswords',
    user: testUserCreationData
  });

  const sessionData = await getSessionReadyForAuthMiddleware({
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
    owner: authSession.user._id as Types.ObjectId
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
