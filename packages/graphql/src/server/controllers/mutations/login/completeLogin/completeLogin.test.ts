import path from 'path';
import {completeLogin} from '.';
import {getAppsPublicKey} from '../../../../utils';
import {getPathToKeyFolder} from 'passwordkeeper.crypto';
import {LOGIN_ERROR_MESSAGES} from '../../../../errors/messages';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {connectToDB, disconnectFromDB, LoginInviteModel} from 'passwordkeeper.database';
import {
  createTestUser,
  TestUserCreationData,
  requestLoginForTestUser,
  getLoginMutationVariables
} from '../../../../utils/testHelpers';
import {
  UserRoles,
  type IUser,
  type DBConnection,
  type IUserDocument,
  type GeneratedRSAKeys,
  type CreateUserMutationVariables,
  type GetLoginNonceMutationPayload,
  type CompleteLoginMutationPayload,
  type CompleteLoginMutationVariables
} from 'passwordkeeper.types';

// store variables needed to test the login invite process
let db: DBConnection;
let testUser: IUserDocument;
let testUserKeys: GeneratedRSAKeys;
let loginInvite: GetLoginNonceMutationPayload;

// path to the test keys
const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'test-keys'),
  'completeLogin'
);

// data to create a test user
const testUserCreationData: IUser = {
  username: 'testCompleteLogin',
  email: 'testCompleteLogin@test.com',
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
  db = await connectToDB('pwd-keeper-test');

  // get the app's public key to decrypt the nonce
  const appPublicKey: string | undefined = await getAppsPublicKey();

  if (!appPublicKey) {
    throw new Error(LOGIN_ERROR_MESSAGES.PUBLIC_KEY_NOT_FOUND);
  }

  // create a test user
  const createTestUserResult = await createTestUser({
    pathToKeys: pathToKeys,
    userRSAKeyName: 'completeLogin',
    user: {...testUserCreationVariables}
  });

  testUserKeys = createTestUserResult.userKeys;
  testUser = createTestUserResult.createdAuthSession.user as IUserDocument;

  // get the login invite
  loginInvite = await requestLoginForTestUser({
    testUser,
    testUserKeys,
    appPublicKey
  });
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('completeLogin', () => {
  it('should throw an error if the nonce is missing', async () => {
    const completeLoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables({
      testUser,
      testUserKeys,
      loginInvite
    });

    await completeLogin(
      undefined,
      {
        // @ts-expect-error - checking for nonce error handling
        completeLoginArgs: {
          // @ts-expect-error - checking for nonce error handling
          signature: completeLoginVariables.signature,
          userId: testUser._id.toString()
        }
      },
      undefined
    ).catch(error => {
      expect(error).toBeDefined();
      expect(error.toString()).toBe(LOGIN_ERROR_MESSAGES.NONCE_REQUIRED);
    });

    expect.assertions(2);
  });

  it('should throw an error if the signature is missing', async () => {
    const completeLoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables({
      testUser,
      testUserKeys,
      loginInvite
    });

    await completeLogin(
      undefined,
      {
        // @ts-expect-error - checking for nonce error handling
        completeLoginArgs: {
          nonce: completeLoginVariables.completeLoginArgs.nonce,
          userId: testUser._id.toString()
        }
      },
      undefined
    ).catch(error => {
      expect(error).toBeDefined();
      expect(error.toString()).toBe(LOGIN_ERROR_MESSAGES.SIGNATURE_REQUIRED);
    });

    expect.assertions(2);
  });

  it('should throw an error if the nonce cannot be decrypted', async () => {
    const completeLoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables({
      testUser,
      testUserKeys,
      loginInvite
    });

    await completeLogin(
      undefined,
      {
        completeLoginArgs: {
          nonce: 'badNonce',
          signature: completeLoginVariables.completeLoginArgs.signature,
          userId: testUser._id.toString()
        }
      },
      undefined
    ).catch(error => {
      expect(error).toBeDefined();
      expect(error.toString()).toBe(LOGIN_ERROR_MESSAGES.ERROR_DECRYPTING_NONCE);
    });

    expect.assertions(2);
  });

  it('Should throw an error if the user invite is not found', async () => {
    const completeLoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables({
      testUser,
      testUserKeys,
      loginInvite
    });

    // delete the login invite from the DB
    await LoginInviteModel.deleteOne({user: testUser._id});
    await completeLogin(undefined, completeLoginVariables, undefined).catch(error => {
      expect(error).toBeDefined();
      expect(error.toString()).toBe(LOGIN_ERROR_MESSAGES.LOGIN_INVITE_NOT_FOUND);
    });

    expect.assertions(2);
  });

  it('Should return an AuthSession if the login is successful', async () => {
    testUserCreationData.username += '2';
    testUserCreationData.email += '2';

    const testUserCreationVariables2: CreateUserMutationVariables = {
      createUserArgs: {username: testUserCreationData.username, email: testUserCreationData.email}
    };

    const createTestUserResult: TestUserCreationData = await createTestUser({
      pathToKeys: pathToKeys,
      userRSAKeyName: 'completeLogin2',
      user: {...testUserCreationVariables2}
    });

    const testUser2LoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables(
      {
        testUser: createTestUserResult.createdAuthSession.user as IUserDocument,
        testUserKeys: createTestUserResult.userKeys,
        loginInvite: await requestLoginForTestUser({
          testUser: createTestUserResult.createdAuthSession.user as IUserDocument,
          testUserKeys: createTestUserResult.userKeys,
          appPublicKey: (await getAppsPublicKey()) as string
        })
      }
    );

    const result: CompleteLoginMutationPayload = await completeLogin(
      undefined,
      testUser2LoginVariables,
      undefined
    );

    expect(result).toBeDefined();
    // remove the public keys from the user object - they are removed from the user object in the mutation
    createTestUserResult.createdAuthSession.user.publicKeys = [];
    expect(result.user).toEqual({...createTestUserResult.createdAuthSession.user});
  });
});
