import path from 'path';
import {getPathToKeyFolder} from '../../../../../utils';
import {beforeAll, afterAll, describe, it} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../../db/connection';
import {
  normalizeKey,
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware
} from '../../../../../utils/testHelpers';
import {
  UserRoles,
  type IUser,
  type DBConnection,
  type IUserDocument,
  AccountStatusTypes,
  type IAccountDocument,
  type IPublicKeyDocument,
  type IAuthSessionDocument,
  type CreateUserMutationVariables,
  type AddPublicKeyMutationPayload,
  type AddPublicKeyMutationVariables,
  type CompleteAccountMutationPayload
} from 'passwordkeeper.types';

import {addPublicKeyMutation} from '.';
import {getAuth} from '../../../../../middleware';
import {AccountModel} from '../../../../../db/Models';

// store variables needed to test the login invite process
let db: DBConnection;
let sessionId: string;
let signature: string;
let userPublicKey: string;
let testUser: IUserDocument;
let validSession: IAuthSessionDocument;
let authSession: CompleteAccountMutationPayload;
let createTestUserResult: TestUserCreationData;

// path to the test keys
const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.addPublicKeyMutation')
);

// data to create a test user
const testUserCreationData: IUser = {
  username: 'testAddPublicKeyMutation',
  email: 'testAddPublicKeyMutation@test.com',
  userRole: UserRoles.ACCOUNT_OWNER
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

  // create a test user
  createTestUserResult = await createTestUser({
    pathToKeys: pathToKeys,
    userRSAKeyName: 'addPublicKeyMutation',
    user: {...testUserCreationVariables}
  });

  testUser = createTestUserResult.createdAuthSession.user as IUserDocument;
  userPublicKey = createTestUserResult.userKeys.publicKey;
  authSession = createTestUserResult.createdAuthSession;

  const sessionData = await getSessionReadyForAuthMiddleware({
    authSession,
    keyName: 'addPublicKeyMutation',
    testUserData: createTestUserResult
  });

  sessionId = sessionData.sessionId as string;
  signature = sessionData.signature as string;

  // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
  validSession = await getAuth({
    headers: {
      authorization: sessionId,
      signature
    }
  });
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('addPublicKeyMutation', () => {
  it('should add a public key to the user account', async () => {
    const newPublicKey = userPublicKey.replace('x', 'y');

    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        key: newPublicKey,
        label: 'testKey1',
        description: 'test key description',
        defaultKey: false
      }
    };

    const result: AddPublicKeyMutationPayload = await addPublicKeyMutation(
      undefined,
      publicKeyData,
      {session: validSession}
    );

    const addedKey: IPublicKeyDocument | undefined = result.user.publicKeys.find(
      (key: IPublicKeyDocument) => key._id.toString() === result.addedKeyId.toString()
    );

    expect(addedKey).toBeDefined();
    expect(normalizeKey(addedKey?.key as string)).toBe(normalizeKey(newPublicKey));
  });

  it("should throw an error if the user's account is anything but ACTIVE", async () => {
    const newPublicKey = userPublicKey.replace('x', 's');

    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        key: newPublicKey,
        label: 'testKey3',
        description: 'test key description',
        defaultKey: false
      }
    };

    for (const status of Object.values(AccountStatusTypes)) {
      if (status === AccountStatusTypes.ACTIVE) {
        continue;
      }

      // update the user's account status
      const updatedAccount: IAccountDocument = (
        await AccountModel.findByIdAndUpdate(
          testUser.account._id,
          {
            status
          },
          {new: true, runValidators: true}
        ).populate('accountType')
      )?.toObject() as IAccountDocument;

      try {
        const sessionData = await getSessionReadyForAuthMiddleware({
          authSession,
          keyName: 'addPublicKeyMutation',
          testUserData: createTestUserResult
        });

        // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
        validSession = (await getAuth({
          headers: {
            authorization: sessionData.sessionId as string,
            signature: sessionData.signature as string
          }
        })) as IAuthSessionDocument;
        // @ts-expect-error - we are testing a suspended account
        validSession.user.account = {...updatedAccount};

        await addPublicKeyMutation(undefined, publicKeyData, {session: validSession});
      } catch (error) {
        expect(error).toBeDefined();
      }
    }

    // there are 5 account statuses, but only 4 are invalid for login
    // SUSPENDED, DELINQUENT, CANCELLED, PENDING are all invalid
    expect.assertions(4);
  });
});
