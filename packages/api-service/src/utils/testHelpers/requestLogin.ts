/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* istanbul ignore file */
import {getLoginNonce} from '../../graphql/controllers/mutations';
import type {
  IUser,
  GeneratedRSAKeys,
  GetLoginNonceMutationPayload,
  GetLoginNonceMutationVariables,
  PrivateKey
} from 'passwordkeeper.types';
import {
  hashData,
  createNonce,
  getPrivateKey,
  encryptWithPublicKey,
  encryptWithPrivateKey
} from '..';

export type RequestLoginForTestUserProps = {
  testUser: IUser;
  testUserKeys: GeneratedRSAKeys;
  appPublicKey: string;
};

export const requestLoginForTestUser = async (
  props: RequestLoginForTestUserProps
): Promise<GetLoginNonceMutationPayload> => {
  // request the login nonce
  const loginChallenge = createNonce() as string;

  // create a hash of the username + challenge
  const signatureHash: string | undefined = await hashData(
    props.testUser.username + loginChallenge
  );
  // get the users keys
  const usersPrivateKey: PrivateKey | undefined = await getPrivateKey(
    props.testUserKeys.pathToPrivateKey
  );

  // sign the hash with the user's private key
  const userSignature: string | undefined = await encryptWithPrivateKey(
    usersPrivateKey as PrivateKey,
    signatureHash as string
  );

  if (!userSignature || !props.appPublicKey) {
    throw new Error('Error getting keys');
  }

  // encrypt the challenge with the apps public key
  const encryptedChallenge: string | undefined = await encryptWithPublicKey(
    props.appPublicKey,
    loginChallenge
  );

  const getLoginNonceArgs: GetLoginNonceMutationVariables = {
    getLoginNonceArgs: {
      username: props.testUser.username,
      challenge: encryptedChallenge as string,
      signature: userSignature
    }
  };

  // get the login invite
  return await getLoginNonce(undefined, getLoginNonceArgs, undefined);
};
