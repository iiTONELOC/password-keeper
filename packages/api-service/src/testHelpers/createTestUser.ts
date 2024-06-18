/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* istanbul ignore file */
import {createUser, completeAccount} from '../graphql/controllers/mutations';
import type {
  GeneratedRSAKeys,
  CreateUserMutationPayload,
  CreateUserMutationVariables,
  CompleteAccountMutationPayload,
  CompleteAccountMutationVariables
} from 'passwordkeeper.types';
import {
  getPublicKey,
  generateRSAKeys,
  getPathToPublicKey,
  encryptWithPublicKey,
  decryptWithPublicKey
} from '../utils';

export type TestUserCreationProps = {
  user: CreateUserMutationVariables;
  pathToKeys: string;
  userRSAKeyName: string;
};

export type TestUserCreationData = {
  userKeys: GeneratedRSAKeys;
  createdAuthSession: CompleteAccountMutationPayload;
  reEncryptedNonce: string;
};

/**
 * Creates a test user, generates RSA keys for the user, and completes the account creation process
 * @param props
 * @returns
 */
export const createTestUser = async (
  props: TestUserCreationProps
): Promise<TestUserCreationData> => {
  const newUser: CreateUserMutationPayload = await createUser(undefined, props.user, undefined);

  // get the invite token for the completeAccount mutation
  const {inviteToken} = newUser || {};

  // get the app's public key to decrypt the nonce
  const appPublicKey: string | undefined = await getPublicKey(getPathToPublicKey());

  /* istanbul ignore next */
  if (!appPublicKey) {
    /* istanbul ignore next */
    throw new Error('Error getting public key');
  }

  //decrypt the nonce
  const decryptedNonce: string | undefined = await decryptWithPublicKey(
    appPublicKey,
    inviteToken?.token
  );

  /* istanbul ignore next */
  if (!decryptedNonce) {
    /* istanbul ignore next */
    throw new Error('Error decrypting nonce');
  }

  // - the user will have their own keys but we need to generate some for the test
  const testUserKeys: GeneratedRSAKeys = (await generateRSAKeys(props.userRSAKeyName, {
    privateKeyPath: props.pathToKeys,
    publicKeyPath: props.pathToKeys
  })) as GeneratedRSAKeys;

  const {publicKey, privateKey} = testUserKeys || {};

  /* istanbul ignore next */
  if (!publicKey || !privateKey) {
    throw new Error('Error generating keys');
  }

  // re-encrypt the nonce with the app's public key
  const reEncryptedNonce: string | undefined = await encryptWithPublicKey(
    appPublicKey,
    decryptedNonce
  );

  /* istanbul ignore next */
  if (!reEncryptedNonce) {
    /* istanbul ignore next */
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

  return {
    reEncryptedNonce,
    userKeys: testUserKeys,
    createdAuthSession: result
  };
};
