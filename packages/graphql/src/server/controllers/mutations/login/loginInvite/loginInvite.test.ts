import path from 'path';
import {getLoginNonce} from './index';
import {getAppsPublicKey} from '../../../../utils';
import {createTestUser} from '../../../../utils/testHelpers';
import {connectToDB, disconnectFromDB} from 'passwordkeeper.database';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {GET_LOGIN_NONCE_ERROR_MESSAGES} from '../../../../errors/messages';
import {
  UserRoles,
  type IUser,
  type PrivateKey,
  type DBConnection,
  type IUserDocument,
  type GeneratedRSAKeys,
  type CreateUserMutationVariables,
  type GetLoginNonceMutationPayload,
  type GetLoginNonceMutationVariables
} from 'passwordkeeper.types';
import {
  hashData,
  createNonce,
  getPrivateKey,
  getPathToKeyFolder,
  encryptWithPublicKey,
  decryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPrivateKey
} from 'passwordkeeper.crypto';

// store variables needed to test the login process
let db: DBConnection;
let testUser: IUserDocument;
let testUserKeys: GeneratedRSAKeys;

// get the path to the keys for the getLoginNonce test
const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'test-keys'),
  'getLoginNonce'
);

// test user data
const testUserCreationData: IUser = {
  username: 'testLoginNonce',
  email: 'testloginnonce@test.com',
  userRole: UserRoles.ACCOUNT_OWNER
};

/**
 * Need to create a test user and keys for the login process
 */
beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');

  const createUser = await createTestUser({
    user: {createUserArgs: {...testUserCreationData} as IUser} as CreateUserMutationVariables,
    pathToKeys: pathToKeys,
    userRSAKeyName: 'getLoginNonce'
  });

  testUser = createUser.createdAuthSession.user as IUserDocument;
  testUserKeys = createUser.userKeys;
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('getLoginNonce', () => {
  it('should return a nonce, user, challenge, and signature', async () => {
    const loginChallenge = createNonce() as string;

    const appsPublicKey: string | undefined = await getAppsPublicKey();

    // create a hash of the username + challenge
    const signatureHash = await hashData(testUser.username + loginChallenge);
    // get the users keys
    const usersPrivateKey: PrivateKey | undefined = await getPrivateKey(
      testUserKeys.pathToPrivateKey
    );

    // sign the hash with the user's private key
    const userSignature: string | undefined = await encryptWithPrivateKey(
      usersPrivateKey as PrivateKey,
      signatureHash as string
    );

    // encrypt the challenge with the apps public key
    const encryptedChallenge: string | undefined = await encryptWithPublicKey(
      appsPublicKey as string,
      loginChallenge
    );

    const getLoginNonceArgs: GetLoginNonceMutationVariables = {
      getLoginNonceArgs: {
        username: testUser.username,
        challenge: encryptedChallenge as string,
        signature: userSignature as string
      }
    };

    const result: GetLoginNonceMutationPayload = await getLoginNonce(
      undefined,
      getLoginNonceArgs,
      undefined
    );
    const {nonce, challengeResponse, signature} = result || {};

    expect(nonce).toBeDefined();
    expect(challengeResponse).toBeDefined();
    expect(signature).toBeDefined();

    // decrypt the nonce with the user's private key
    const decryptedNonce: string | undefined = await decryptWithPrivateKey(
      usersPrivateKey as PrivateKey,
      nonce
    );

    // decrypt the challenge response with the users private key
    const decryptedChallengeResponse: string | undefined = await decryptWithPrivateKey(
      usersPrivateKey as PrivateKey,
      challengeResponse
    );

    if (!decryptedChallengeResponse) {
      throw new Error('Error decrypting challenge response');
    }

    // see if the challenges match
    const challengeMatch: boolean = decryptedChallengeResponse === loginChallenge;

    expect(challengeMatch).toBeTruthy();

    // verify the signature
    const hash: string | undefined = await hashData(decryptedNonce + loginChallenge);
    const decryptedSignature: string | undefined = await decryptWithPublicKey(
      appsPublicKey as string,
      signature
    );

    const signatureMatch: boolean = hash === decryptedSignature;

    expect(signatureMatch).toBeTruthy();

    expect.assertions(5);
  });

  it('should throw an error if the username is missing', async () => {
    await getLoginNonce(
      undefined,
      {
        // @ts-expect-error - checking for username error handling
        getLoginNonceArgs: {
          challenge: 'testChallenge',
          signature: 'testSignature'
        }
      },
      undefined
    ).catch(error => {
      expect(error).toBeDefined();
      expect(error.toString()).toBe(GET_LOGIN_NONCE_ERROR_MESSAGES.USERNAME_REQUIRED);
    });

    expect.assertions(2);
  });

  it('should throw an error if the challenge is missing', async () => {
    await getLoginNonce(
      undefined,
      {
        // @ts-expect-error - checking for challenge error handling
        getLoginNonceArgs: {
          username: 'testUsername',
          signature: 'testSignature'
        }
      },
      undefined
    ).catch(error => {
      expect(error).toBeDefined();
      expect(error.toString()).toBe(GET_LOGIN_NONCE_ERROR_MESSAGES.CHALLENGE_REQUIRED);
    });
  });

  it('should throw an error if the signature is missing', async () => {
    await getLoginNonce(
      undefined,
      {
        // @ts-expect-error - checking for signature error handling
        getLoginNonceArgs: {
          username: 'testUsername',
          challenge: 'testChallenge'
        }
      },
      undefined
    ).catch(error => {
      expect(error).toBeDefined();
      expect(error.toString()).toBe(GET_LOGIN_NONCE_ERROR_MESSAGES.SIGNATURE_REQUIRED);
    });
  });

  it('should throw an error if the user is not found', async () => {
    await getLoginNonce(
      undefined,
      {
        getLoginNonceArgs: {
          username: 'testUsername12',
          challenge: 'testChallenge',
          signature: 'testSignature'
        }
      },
      undefined
    ).catch(error => {
      expect(error).toBeDefined();
      expect(error.toString()).toBe(GET_LOGIN_NONCE_ERROR_MESSAGES.USER_NOT_FOUND);
    });
  });
});
