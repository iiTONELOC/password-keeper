import path from 'path';
import {completeAccount} from './index';
import {createUser} from '../createUser';
import {
  DBConnection,
  GeneratedRSAKeys,
  CreateUserMutationPayload,
  CreateUserMutationVariables,
  CompleteAccountMutationPayload,
  CompleteAccountMutationVariables
} from 'passwordkeeper.types';
import {
  getPublicKey,
  generateRSAKeys,
  getPathToKeyFolder,
  getPathToPublicKey,
  decryptWithPublicKey,
  encryptWithPublicKey
} from '../../../../utils';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';

const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'test-keys'),
  'completeAccount'
);

let db: DBConnection;

beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('completeAccount', () => {
  it('should complete the account creation process', async () => {
    const testUserCreationData: CreateUserMutationVariables = {
      createUserArgs: {
        username: 'completeAccountTestUser',
        email: 'completeAccountTestUser@test.com'
      }
    };

    // create the user
    const newUser: CreateUserMutationPayload = await createUser(
      undefined,
      testUserCreationData,
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
    const testUserKeys: GeneratedRSAKeys | undefined = await generateRSAKeys('completeAccount', {
      privateKeyPath: pathToKeys,
      publicKeyPath: pathToKeys
    });

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

    // check the result should have a _id, nonce, user, and expiresAt
    expect(result).toBeDefined();
    expect(result._id).toBeDefined();
    expect(result.nonce).toBeDefined();
    expect(result.user).toBeDefined();

    // the user should have an _id, username, and email and they should match the user created
    expect(result.user._id).toBeDefined();
    expect(result.user.username).toBe(testUserCreationData.createUserArgs.username);
    expect(result.user.email).toBe(testUserCreationData.createUserArgs.email);

    // the expiresAt should be a date
    expect(result.expiresAt).toBeDefined();
    expect(result.expiresAt).toBeInstanceOf(Date);

    expect.assertions(9);
  });
});
