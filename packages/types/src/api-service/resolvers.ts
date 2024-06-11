import {Types} from 'mongoose';
import {IUserDocument} from './models';

export type CreateUserMutationVariables = {
  createUserArgs: {
    username: string;
    email: string;
  };
};

export type CreateUserMutationPayload = {
  user: IUserDocument;
  inviteToken: {token: string; expiresAt: Date};
};

export type CompleteAccountMutationVariables = {
  completeAccountArgs: {
    nonce: string;
    publicKey: string;
  };
};

export type CompleteAccountMutationPayload = {
  _id: Types.ObjectId | string;
  nonce: string;
  user: Partial<IUserDocument>;
  expiresAt: Date;
};

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

export type CompleteLoginMutationVariables = {
  completeLoginArgs: {
    nonce: string;
    signature: string;
    userId: string;
  };
};

export type CompleteLoginMutationPayload = {
  _id: Types.ObjectId | string;
  nonce: string;
  user: Partial<IUserDocument>;
  expiresAt: Date;
};
