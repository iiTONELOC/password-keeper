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
