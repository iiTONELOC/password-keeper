import path from 'path';
import {getAuth} from '.';
import {getPathToKeyFolder} from '../../utils';
import {AuthSessionModel} from '../../db/Models';
import dbConnection, {disconnectFromDB} from '../../db/connection';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {decryptNonceWithUsersPrivateKey} from '../../../test-scripts/session-nonce';
import {
  TestUserCreationData,
  createTestUser,
  getSessionReadyForAuthMiddleware
} from '../../utils/testHelpers';
import {
  DBConnection,
  CreateUserMutationVariables,
  CompleteAccountMutationPayload,
  IAuthSessionDocument
} from 'passwordkeeper.types';

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.getAuthMiddleware')
);

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'getAuthMiddlewareTestUser',
    email: 'getAuthMiddlewareTestUser@test.com'
  }
};

let db: DBConnection;
let testUserData: TestUserCreationData;
let authSession: CompleteAccountMutationPayload;
let sessionId: string;
let signature: string;

beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');
  testUserData = await createTestUser({
    pathToKeys,
    userRSAKeyName: 'getAuthMiddleware',
    user: testUserCreationData
  });

  // get the created auth session for the test user
  authSession = testUserData.createdAuthSession;
  const sessionData = await getSessionReadyForAuthMiddleware({
    testUserData,
    authSession,
    keyName: 'getAuthMiddleware'
  });
  sessionId = sessionData.sessionId as string;
  signature = sessionData.signature as string;
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('getAuthMiddleware', () => {
  // make a request to the getAuthMiddleware endpoint with the headers

  it('should return the auth session if the session is valid', async () => {
    const reqData = {
      headers: {
        authorization: sessionId,
        signature: signature
      }
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth(reqData);

    expect(validSession).toBeDefined();
    expect(validSession.user.username).toBe(testUserData.createdAuthSession.user.username);
  });

  it('should return undefined if the session is invalid', async () => {
    const reqData = {
      headers: {
        authorization: 'invalidSessionId',
        signature: 'invalidSignature'
      }
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    expect(await getAuth(reqData)).toBeUndefined();
  });

  it('should return undefined if the session is expired', async () => {
    // decrypt the session id so we can update the session
    const decryptedID = await decryptNonceWithUsersPrivateKey(
      authSession._id as string,
      'getAuthMiddleware'
    );

    // set the session to expire in the past
    await AuthSessionModel.updateOne({_id: decryptedID}, {expiresAt: new Date('2021-01-01')});

    const reqData = {
      headers: {
        authorization: sessionId,
        signature: signature
      }
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    expect(await getAuth(reqData)).toBeUndefined();
  });
});
