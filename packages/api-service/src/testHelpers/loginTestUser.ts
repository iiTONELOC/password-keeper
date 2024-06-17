/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type {
  PrivateKey,
  IUserDocument,
  GeneratedRSAKeys,
  GetLoginNonceMutationPayload,
  CompleteLoginMutationVariables
} from 'passwordkeeper.types';
import {
  hashData,
  getPublicKey,
  getPrivateKey,
  getPathToPublicKey,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPrivateKey
} from '../utils';

export type LoginTestUserProps = {
  testUser: IUserDocument;
  testUserKeys: GeneratedRSAKeys;
  loginInvite: GetLoginNonceMutationPayload;
};

export const getLoginMutationVariables = async (
  props: LoginTestUserProps
): Promise<CompleteLoginMutationVariables> => {
  const {nonce} = props.loginInvite || {};
  const privateKey: PrivateKey | undefined = await getPrivateKey(
    props.testUserKeys.pathToPrivateKey
  );
  // decrypt the nonce using the user's private key
  const decryptedNonce: string | undefined = await decryptWithPrivateKey(
    privateKey as PrivateKey,
    nonce
  );

  /* istanbul ignore next */
  if (!decryptedNonce) {
    /* istanbul ignore next */
    throw new Error('Error decrypting nonce');
  }

  // get the app's public key
  const appPublicKey: string | undefined = await getPublicKey(getPathToPublicKey());

  /* istanbul ignore next */
  if (!appPublicKey) {
    /* istanbul ignore next */
    throw new Error('Error getting public key');
  }

  // generate the signature hash
  // signature = hash(userid + nonce)
  const signatureHash = await hashData(props.testUser._id + decryptedNonce);

  // sign the hash with the user's private key
  const userSignature: string | undefined = await encryptWithPrivateKey(
    privateKey as PrivateKey,
    signatureHash as string
  );

  /* istanbul ignore next */
  if (!userSignature) {
    /* istanbul ignore next */
    throw new Error('Error signing hash');
  }

  // encrypt the nonce with the app's public key for transport
  const encryptedNonce: string | undefined = await encryptWithPublicKey(
    appPublicKey,
    decryptedNonce
  );

  /* istanbul ignore next */
  if (!encryptedNonce) {
    /* istanbul ignore next */
    throw new Error('Error encrypting nonce');
  }

  const completeLoginArgs: CompleteLoginMutationVariables = {
    completeLoginArgs: {
      nonce: encryptedNonce,
      signature: userSignature,
      userId: props.testUser._id.toString()
    }
  };

  return completeLoginArgs;
};
