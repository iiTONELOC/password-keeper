import path from 'path';
import {completeLogin} from '.';
import {getAppsPublicKey} from '../../../../utils';
import {getPathToKeyFolder} from 'passwordkeeper.crypto';
import {LOGIN_ERROR_MESSAGES} from '../../../../errors/messages';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {connectToDB, disconnectFromDB, LoginInviteModel} from 'passwordkeeper.database';
import {
  createTestUser,
  requestLoginForTestUser,
  getLoginMutationVariables
} from '../../../../utils/testHelpers';
import {
  UserRoles,
  type IUser,
  type DBConnection,
  type IUserDocument,
  type CreateUserMutationPayload,
  type CreateUserMutationVariables,
  type GetLoginNonceMutationPayload,
  type CompleteLoginMutationPayload,
  type CompleteLoginMutationVariables
} from 'passwordkeeper.types';

// store variables needed to test the login invite process
let db: DBConnection;

let authSession: CreateUserMutationPayload;
let loginInvite: GetLoginNonceMutationPayload;

// path to the test keys
const pathToKeys: string = path.join(getPathToKeyFolder()?.replace('.private', '.completeLogin'));

// data to create a test user
const testUserCreationData: IUser = {
  username: 'completeLogin',
  email: 'completeLogin@test.com',
  userRole: UserRoles.ACCOUNT_OWNER
};

// variables to create a test user using graphql mutation
const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {
    username: testUserCreationData.username,
    email: testUserCreationData.email,
    publicKey: ''
  }
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
  authSession = await createTestUser({
    pathToKeys: pathToKeys,
    userRSAKeyName: 'completeLogin',
    user: {...testUserCreationVariables}
  });

  const publicKey: string = authSession.user?.publicKeys?.[0]?.key as string;

  // get the login invite
  loginInvite = await requestLoginForTestUser({
    testUser: authSession.user as IUserDocument,
    testUserKeys: {
      publicKey,
      privateKey: '',
      pathToPrivateKey: path.join(pathToKeys, `${authSession.user?.username}_private.pem`),
      pathToPublicKey: path.join(pathToKeys, `${authSession.user?.username}_public.pem`)
    },
    appPublicKey
  });
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('completeLogin', () => {
  it('should throw an error if the nonce is missing', async () => {
    const publicKey: string = authSession.user?.publicKeys?.[0]?.key as string;

    const completeLoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables({
      testUser: authSession.user as IUserDocument,
      testUserKeys: {
        publicKey,
        privateKey: '',
        pathToPrivateKey: path.join(pathToKeys, `${authSession.user?.username}_private.pem`),
        pathToPublicKey: path.join(pathToKeys, `${authSession.user?.username}_public.pem`)
      },
      loginInvite
    });

    await completeLogin(
      undefined,
      {
        // @ts-expect-error - checking for nonce error handling
        completeLoginArgs: {
          // @ts-expect-error - checking for nonce error handling
          signature: completeLoginVariables.signature,
          userId: authSession?.user?._id?.toString() as string
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
    const publicKey: string = authSession.user?.publicKeys?.[0]?.key as string;

    const completeLoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables({
      testUser: authSession.user as IUserDocument,
      testUserKeys: {
        publicKey,
        privateKey: '',
        pathToPrivateKey: path.join(pathToKeys, `${authSession.user?.username}_private.pem`),
        pathToPublicKey: path.join(pathToKeys, `${authSession.user?.username}_public.pem`)
      },
      loginInvite
    });

    await completeLogin(
      undefined,
      {
        // @ts-expect-error - checking for nonce error handling
        completeLoginArgs: {
          nonce: completeLoginVariables.completeLoginArgs.nonce,
          userId: authSession?.user?._id?.toString() as string
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
    const publicKey: string = authSession.user?.publicKeys?.[0]?.key as string;

    const completeLoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables({
      testUser: authSession.user as IUserDocument,
      testUserKeys: {
        publicKey,
        privateKey: '',
        pathToPrivateKey: path.join(pathToKeys, `${authSession.user?.username}_private.pem`),
        pathToPublicKey: path.join(pathToKeys, `${authSession.user?.username}_public.pem`)
      },
      loginInvite
    });

    await completeLogin(
      undefined,
      {
        completeLoginArgs: {
          nonce: 'badNonce',
          signature: completeLoginVariables.completeLoginArgs.signature,
          userId: authSession?.user?._id?.toString() as string
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
    const publicKey: string = authSession.user?.publicKeys?.[0]?.key as string;

    const completeLoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables({
      testUser: authSession.user as IUserDocument,
      testUserKeys: {
        publicKey,
        privateKey: '',
        pathToPrivateKey: path.join(pathToKeys, `${authSession.user?.username}_private.pem`),
        pathToPublicKey: path.join(pathToKeys, `${authSession.user?.username}_public.pem`)
      },
      loginInvite
    });

    // delete the login invite from the DB
    await LoginInviteModel.deleteOne({user: authSession?.user?._id?.toString() as string});
    await completeLogin(undefined, completeLoginVariables, undefined).catch(error => {
      expect(error).toBeDefined();
      expect(error.toString()).toBe(LOGIN_ERROR_MESSAGES.LOGIN_INVITE_NOT_FOUND);
    });

    expect.assertions(2);
  });

  it('Should return an AuthSession if the login is successful', async () => {
    const testUserCreationVariables2: CreateUserMutationVariables = {
      createUserArgs: {
        username: testUserCreationData.username + '2',
        email: testUserCreationData.email + '2',
        publicKey: ''
      }
    };

    const pathToKeys: string = path.join(
      getPathToKeyFolder()?.replace('.private', '.completeLogin2')
    );

    const createTestUserResult: CreateUserMutationPayload = await createTestUser({
      pathToKeys,
      userRSAKeyName: 'completeLogin2',
      user: {...testUserCreationVariables2}
    });

    const testUserKeys = {
      publicKey: createTestUserResult.user?.publicKeys?.[0]?.key as string,
      privateKey: '',
      pathToPrivateKey: path.join(
        pathToKeys,
        `${createTestUserResult?.user?.username}_private.pem`
      ),
      pathToPublicKey: path.join(pathToKeys, `${createTestUserResult?.user?.username}_public.pem`)
    };

    const testUser2LoginVariables: CompleteLoginMutationVariables = await getLoginMutationVariables(
      {
        testUser: createTestUserResult.user as IUserDocument,
        testUserKeys,
        loginInvite: await requestLoginForTestUser({
          testUser: createTestUserResult.user as IUserDocument,
          testUserKeys,
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
    createTestUserResult.user.publicKeys = [];
    expect(result.user).toEqual({...createTestUserResult.user});
  });
});
