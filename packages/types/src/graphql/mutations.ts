/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {AddPublicKeyReturns} from './helpers';
import {IUserDocument, IEncryptedData, ValidAccountTypes, IPublicKeyDocument} from '../db';

// ______________ Create User Mutation ______________
export type CreateUserMutationVariables = {
  createUserArgs: {
    email: string;
    username: string;
    publicKey: string;
    accountType?: ValidAccountTypes;
  };
};

export type CreateUserMutationPayload = {
  expiresAt: Date;
  nonce: string;
  _id: string;
  user: Partial<IUserDocument>;
};

// ______________ Update User Mutation ______________
export type UpdateUserMutationVariables = {
  updateUserArgs: {
    username?: string;
    email?: string;
  };
};

export type UpdateUserMutationPayload = IUserDocument;

// ______________ Get Login Nonce Mutation ______________
export type GetLoginNonceMutationVariables = {
  getLoginNonceArgs: {
    username: string;
    challenge: string;
    /**
     * The signature of the challenge
     *
     * hash of the username + challenge
     * signed with the user's private key
     */
    signature: string;
    publicKeyId?: string;
  };
};

export type GetLoginNonceMutationPayload = {
  nonce: string;
  challengeResponse: string;
  /**
   * The signature of the challenge
   * signed with the app's private key
   *
   * hash of the nonce + challengeResponse
   */
  signature: string;
};

// ______________ Complete Login Mutation ______________
export type CompleteLoginMutationVariables = {
  completeLoginArgs: {
    nonce: string;
    signature: string;
    userId: string;
    publicKeyId?: string;
  };
};

export type CompleteLoginMutationPayload = {
  expiresAt: Date;
  nonce: string;
  _id: string;
  user: Partial<IUserDocument>;
};

// ______________ Add Password Mutation ______________
export type AddPasswordMutationVariables = {
  addPasswordArgs: {
    url?: IEncryptedData;
    name: IEncryptedData;
    username: IEncryptedData;
    password: IEncryptedData;
  };
};

// ______________ Update Password Mutation ______________
export type UpdatePasswordMutationVariables = {
  updatePasswordArgs: {
    id: string;
    expiresAt?: Date;
    url?: IEncryptedData;
    name?: IEncryptedData;
    username?: IEncryptedData;
    password?: IEncryptedData;
  };
};

// ______________ Add Public Key Mutation ______________
export type AddPublicKeyMutationVariables = {
  addPublicKeyArgs: {
    key: string;
    label?: string;
    description?: string;
    expiresAt?: Date;
    defaultKey?: boolean;
  };
};

export type AddPublicKeyMutationPayload = AddPublicKeyReturns;

// ______________ Update Public Key Mutation ______________
export type UpdatePublicKeyMutationVariables = {
  updatePublicKeyArgs: {
    id: string;
    key?: string;
    label?: string;
    description?: string;
    expiresAt?: Date;
    defaultKey?: boolean;
  };
};

export type UpdatePublicKeyMutationPayload = IPublicKeyDocument;

// ______________ Delete Public Key Mutation ______________
export type DeletePublicKeyMutationVariables = {
  deletePublicKeyArgs: {
    id: string;
  };
};

export type DeletePublicKeyMutationPayload = IPublicKeyDocument;
