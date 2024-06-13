import path from 'path';
import {getLoginNonce} from './index';
import {createUser} from '../createUser';
import {completeAccount} from '../completeAccount';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import type {
  IUser,
  PrivateKey,
  DBConnection,
  IUserDocument,
  GeneratedRSAKeys,
  CreateUserMutationPayload,
  CreateUserMutationVariables,
  GetLoginNonceMutationPayload,
  GetLoginNonceMutationVariables,
  CompleteAccountMutationPayload,
  CompleteAccountMutationVariables
} from 'passwordkeeper.types';
import {
  hashData,
  createNonce,
  getPublicKey,
  getPrivateKey,
  generateRSAKeys,
  getPathToKeyFolder,
  getPathToPublicKey,
  encryptWithPublicKey,
  decryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPrivateKey
} from '../../../../utils';

let db: DBConnection;
let testUser: IUserDocument;
let testUserKeys: GeneratedRSAKeys;

const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'test-keys'),
  'getLoginNonce'
);

const testUserCreationData: IUser = {
  username: 'testLoginNonce',
  email: 'testloginnonce@test.com'
};

const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {username: testUserCreationData.username, email: testUserCreationData.email}
};

/**
 * Need to create a test user and keys for the login process
 */
beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');
  // create the user
  const newUser: CreateUserMutationPayload = await createUser(
    undefined,
    testUserCreationVariables,
    undefined
  );

  // get the invite token for the completeAccount mutation
  const {inviteToken} = newUser || {};

  // get the app's public key to decrypt the nonce
  const appPublicKey: string | undefined = await getPublicKey(getPathToPublicKey());

  if (!appPublicKey) {
    throw new Error('Error getting public key');
  }

  //decrypt the nonce
  const decryptedNonce: string | undefined = await decryptWithPublicKey(
    appPublicKey,
    inviteToken?.token
  );

  if (!decryptedNonce) {
    throw new Error('Error decrypting nonce');
  }

  // - the user will have their own keys but we need to generate some for the test
  testUserKeys = (await generateRSAKeys('getLoginNonce', {
    privateKeyPath: pathToKeys,
    publicKeyPath: pathToKeys
  })) as GeneratedRSAKeys;

  const {publicKey, privateKey} = testUserKeys || {};

  if (!publicKey || !privateKey) {
    throw new Error('Error generating keys');
  }

  // re-encrypt the nonce with the app's public key
  const reEncryptedNonce: string | undefined = await encryptWithPublicKey(
    appPublicKey,
    decryptedNonce
  );

  if (!reEncryptedNonce) {
    throw new Error('Error re-encrypting nonce');
  }

  const competeAccountArgs: CompleteAccountMutationVariables = {
    completeAccountArgs: {
      nonce: reEncryptedNonce,
      publicKey
    }
  };

  // complete the account creation process
  const result: CompleteAccountMutationPayload = await completeAccount(
    undefined,
    competeAccountArgs,
    undefined
  );

  testUser = result.user as IUserDocument;
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('getLoginNonce', () => {
  it('should return a nonce, user, challenge, and signature', async () => {
    const loginChallenge = createNonce() as string;

    const appsPublicKey: string | undefined = await getPublicKey(getPathToPublicKey());

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

    if (!userSignature || !appsPublicKey) {
      throw new Error('Error getting keys');
    }

    // encrypt the challenge with the apps public key
    const encryptedChallenge: string | undefined = await encryptWithPublicKey(
      appsPublicKey,
      loginChallenge
    );

    const getLoginNonceArgs: GetLoginNonceMutationVariables = {
      getLoginNonceArgs: {
        username: testUser.username,
        challenge: encryptedChallenge as string,
        signature: userSignature
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

    if (!decryptedNonce) {
      throw new Error('Error decrypting nonce');
    }

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
      appsPublicKey,
      signature
    );

    if (!decryptedSignature) {
      throw new Error('Error decrypting signature');
    }

    const signatureMatch: boolean = hash === decryptedSignature;

    expect(signatureMatch).toBeTruthy();

    expect.assertions(5);
  });
});
