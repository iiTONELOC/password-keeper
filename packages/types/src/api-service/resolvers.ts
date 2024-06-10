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
