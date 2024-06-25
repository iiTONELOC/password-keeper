/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {AddPublicKeyReturns} from './helpers';
import {IEncryptedData, IPublicKeyDocument, IUserDocument, ValidAccountTypes} from './models';

// ______________ Create User Mutation ______________
export type CreateUserMutationVariables = {
  createUserArgs: {
    username: string;
    email: string;
    accountType?: ValidAccountTypes;
  };
};

export type CreateUserMutationPayload = {
  user: IUserDocument;
  inviteToken: {token: string; expiresAt: Date};
};

// ______________ Update User Mutation ______________
export type UpdateUserMutationVariables = {
  updateUserArgs: {
    username?: string;
    email?: string;
  };
};

export type UpdateUserMutationPayload = IUserDocument;

// ______________ Complete Account Mutation ______________
export type CompleteAccountMutationVariables = {
  completeAccountArgs: {
    nonce: string;
    publicKey: string;
  };
};

export type CompleteAccountMutationPayload = {
  _id: string;
  nonce: string;
  user: Partial<IUserDocument>;
  expiresAt: Date;
};

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
  _id: string;
  nonce: string;
  user: Partial<IUserDocument>;
  expiresAt: Date;
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
