import path from 'path';
import {getAuth} from '.';
import {getPathToKeyFolder} from 'passwordkeeper.crypto';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {decryptNonceWithUsersPrivateKey} from '../../test-scripts/session-nonce';
import {
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware
} from '../../utils/testHelpers';
import {
  connectToDB,
  AccountModel,
  AuthSessionModel,
  disconnectFromDB
} from 'passwordkeeper.database';

import {
  DBConnection,
  AccountStatusTypes,
  IAuthSessionDocument,
  CreateUserMutationVariables,
  CompleteAccountMutationPayload
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
  db = await connectToDB('pwd-keeper-test');
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

  it('should return undefined if the headers are missing', async () => {
    const reqData = {
      headers: {}
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    expect(await getAuth(reqData)).toBeUndefined();
  });

  it('should return undefined if the account status is suspended', async () => {
    // update the account status to suspended
    await AccountModel.updateOne(
      {owner: testUserData.createdAuthSession.user._id},
      {status: AccountStatusTypes.SUSPENDED}
    );

    const reqData = {
      headers: {
        authorization: sessionId,
        signature: signature
      }
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    expect(await getAuth(reqData)).toBeUndefined();
  });

  it('should return undefined if the account status is delinquent', async () => {
    // update the account status to delinquent
    await AccountModel.updateOne(
      {owner: testUserData.createdAuthSession.user._id},
      {status: AccountStatusTypes.DELINQUENT}
    );

    const reqData = {
      headers: {
        authorization: sessionId,
        signature: signature
      }
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    expect(await getAuth(reqData)).toBeUndefined();
  });

  it('should return undefined if the account status is pending', async () => {
    // update the account status to pending
    await AccountModel.updateOne(
      {owner: testUserData.createdAuthSession.user._id},
      {status: AccountStatusTypes.PENDING}
    );

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
