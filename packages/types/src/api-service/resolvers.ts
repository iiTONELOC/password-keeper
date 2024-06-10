import {IUserDocument} from './models';

export type CreateUserMutationVariables = {
  username: string;
  email: string;
};

export type CreateUserMutationPayload = Promise<{user: IUserDocument}>;
