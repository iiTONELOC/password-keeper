import {GraphQLError} from 'graphql';
import {UserModel} from '../../../db/Models';
import type {
  IUserDocument,
  CreateUserMutationPayload,
  CreateUserMutationVariables
} from 'packages/types/src/';

export const createUser = async (
  _: undefined,
  args: CreateUserMutationVariables,
  __: undefined
): CreateUserMutationPayload => {
  const {username, email} = args;

  if (!username) {
    throw new GraphQLError('Username is required');
  }

  if (!email) {
    throw new GraphQLError('Email is required');
  }

  try {
    const user: IUserDocument = (await UserModel.create({username, email}))?.toObject();

    if (!user) {
      throw new GraphQLError('Failed to create user');
    }

    return {user};
  } catch (error: any) {
    if (error?.toString()?.includes('E11000 duplicate key error')) {
      throw new GraphQLError('User already exists');
    } else {
      throw new GraphQLError('Error creating user');
    }
  }
};
