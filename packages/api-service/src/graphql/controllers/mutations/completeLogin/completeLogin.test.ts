import path from 'path';
import {KeyObject} from 'crypto';
import {completeLogin} from './index';
import {createUser} from '../createUser';
import {getLoginNonce} from '../loginInvite';
import {completeAccount} from '../completeAccount';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import type {
  IUser,
  DBConnection,
  IUserDocument,
  GeneratedRSAKeys,
  CreateUserMutationPayload,
  CreateUserMutationVariables,
  GetLoginNonceMutationPayload,
  CompleteLoginMutationPayload,
  CompleteLoginMutationVariables,
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
let loginInvite: GetLoginNonceMutationPayload;

const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'test-keys'),
  'completeLogin'
);

const testUserCreationData: IUser = {
  username: 'testCompleteLogin',
  email: 'testCompleteLogin@test.com'
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
  testUserKeys = (await generateRSAKeys('completeLogin', {
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

  // request the login nonce

  const loginChallenge = createNonce() as string;

  // create a hash of the username + challenge
  const signatureHash: string | undefined = await hashData(testUser.username + loginChallenge);
  // get the users keys
  const usersPrivateKey: KeyObject | undefined = await getPrivateKey(testUserKeys.pathToPrivateKey);

  // sign the hash with the user's private key
  const userSignature: string | undefined = await encryptWithPrivateKey(
    usersPrivateKey as KeyObject,
    signatureHash as string
  );

  if (!userSignature || !appPublicKey) {
    throw new Error('Error getting keys');
  }

  // encrypt the challenge with the apps public key
  const encryptedChallenge: string | undefined = await encryptWithPublicKey(
    appPublicKey,
    loginChallenge
  );

  const getLoginNonceArgs: GetLoginNonceMutationVariables = {
    getLoginNonceArgs: {
      username: testUser.username,
      challenge: encryptedChallenge as string,
      signature: userSignature
    }
  };

  // get the login invite
  loginInvite = await getLoginNonce(undefined, getLoginNonceArgs, undefined);
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('completeLogin', () => {
  it('should complete the login process and return an AuthSession', async () => {
    const {nonce} = loginInvite || {};
    const privateKey: KeyObject | undefined = await getPrivateKey(testUserKeys.pathToPrivateKey);
    // decrypt the nonce using the user's private key
    const decryptedNonce: string | undefined = await decryptWithPrivateKey(
      privateKey as KeyObject,
      nonce
    );

    if (!decryptedNonce) {
      throw new Error('Error decrypting nonce');
    }

    // get the app's public key
    const appPublicKey: string | undefined = await getPublicKey(getPathToPublicKey());

    if (!appPublicKey) {
      throw new Error('Error getting public key');
    }

    // generate the signature hash
    // signature = hash(userid + nonce)
    const signatureHash = await hashData(testUser._id + decryptedNonce);

    // sign the hash with the user's private key
    const userSignature: string | undefined = await encryptWithPrivateKey(
      privateKey as KeyObject,
      signatureHash as string
    );

    if (!userSignature) {
      throw new Error('Error signing hash');
    }

    // encrypt the nonce with the app's public key for transport
    const encryptedNonce: string | undefined = await encryptWithPublicKey(
      appPublicKey,
      decryptedNonce
    );

    if (!encryptedNonce) {
      throw new Error('Error encrypting nonce');
    }

    const completeLoginArgs: CompleteLoginMutationVariables = {
      completeLoginArgs: {
        nonce: encryptedNonce,
        signature: userSignature,
        userId: testUser._id.toString()
      }
    };

    const loginResult: CompleteLoginMutationPayload = await completeLogin(
      undefined,
      completeLoginArgs,
      undefined
    );

    expect(loginResult).toHaveProperty('_id');
    expect(loginResult).toHaveProperty('nonce');
    expect(loginResult).toHaveProperty('user');
    expect(loginResult).toHaveProperty('expiresAt');
  });
});
