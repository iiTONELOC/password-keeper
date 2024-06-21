import path from 'path';
import {getPathToKeyFolder} from '../../../../utils';
import {beforeAll, afterAll, describe, it} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';
import {
  normalizeKey,
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware
} from '../../../../utils/testHelpers';
import {
  UserRoles,
  type IUser,
  type DBConnection,
  type IUserDocument,
  type IPublicKeyDocument,
  type IAuthSessionDocument,
  type CreateUserMutationVariables,
  type AddPublicKeyMutationPayload,
  type AddPublicKeyMutationVariables,
  type CompleteAccountMutationPayload,
  IAccountDocument,
  AccountStatusTypes
} from 'passwordkeeper.types';

import {addPublicKeyMutation} from '.';
import {getAuth} from '../../../../middleware';
import {AccountModel} from '../../../../db/Models';

// store variables needed to test the login invite process
let db: DBConnection;
let sessionId: string;
let signature: string;
let userPublicKey: string;
let testUser: IUserDocument;
let authSession: CompleteAccountMutationPayload;
let validSession: IAuthSessionDocument;

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
  const createTestUserResult: TestUserCreationData = await createTestUser({
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
        publicKey: newPublicKey,
        userId: testUser._id,
        label: 'testKey',
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

  it('should throw an error if the user is not authorized to add a key', async () => {
    const newPublicKey = userPublicKey.replace('x', 't');

    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        publicKey: newPublicKey,
        // @ts-expect-error - we are testing the error case
        userId: 'fakeUserId',
        label: 'testKey',
        description: 'test key description',
        defaultKey: false
      }
    };

    await expect(
      addPublicKeyMutation(undefined, publicKeyData, {session: validSession})
    ).rejects.toThrow('Error adding public key');
  });

  it('should throw an error if the user account is not present', async () => {
    const newPublicKey = userPublicKey.replace('x', 'z');

    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        publicKey: newPublicKey,
        userId: testUser._id,
        label: 'testKey',
        description: 'test key description',
        defaultKey: false
      }
    };

    const invalidSession = {...validSession};
    // @ts-expect-error - we are testing the error case
    invalidSession.user.account = undefined;

    await expect(
      // @ts-expect-error - we are testing the error case
      addPublicKeyMutation(undefined, publicKeyData, {session: invalidSession})
    ).rejects.toThrow('Error adding public key');
  });

  it("should throw an error if the user's account is anything but ACTIVE", async () => {
    const newPublicKey = userPublicKey.replace('x', 's');

    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        publicKey: newPublicKey,
        userId: testUser._id,
        label: 'testKey',
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

      // @ts-expect-error - we are testing a suspended account
      validSession.user.account = {...updatedAccount};

      await expect(
        addPublicKeyMutation(undefined, publicKeyData, {session: validSession})
      ).rejects.toThrow('Error adding public key');
    }
  });
});
