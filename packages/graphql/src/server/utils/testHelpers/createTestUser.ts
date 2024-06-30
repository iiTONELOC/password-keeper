/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* istanbul ignore file */
import path from 'path';
import {createUser} from '../../controllers/mutations';
import {generateRSAKeys, getPathToKeyFolder} from 'passwordkeeper.crypto';
import type {
  GeneratedRSAKeys,
  ValidAccountTypes,
  CreateUserMutationPayload,
  CreateUserMutationVariables
} from 'passwordkeeper.types';

export type TestUserCreationProps = {
  pathToKeys: string;
  userRSAKeyName: string;
  user: {
    createUserArgs: {
      email: string;
      username: string;
      publicKey?: string;
      accountType?: ValidAccountTypes;
    };
  };
};

/**
 * Generates test keys and creates a test user
 * @param props
 * @returns
 */
export const createTestUser = async (
  props: TestUserCreationProps
): Promise<CreateUserMutationPayload> => {
  // path to the test keys
  const pathToKeys: string = path.join(
    getPathToKeyFolder()?.replace('.private', `.${props.user.createUserArgs.username}`)
  );

  const testUserKeys = (await generateRSAKeys(props.userRSAKeyName, {
    privateKeyPath: pathToKeys,
    publicKeyPath: pathToKeys
  })) as GeneratedRSAKeys;

  if (!testUserKeys) {
    throw new Error('Error generating RSA keys');
  }

  props.user.createUserArgs['publicKey'] = testUserKeys.publicKey;

  const newUser: CreateUserMutationPayload = await createUser(
    undefined,
    props.user as CreateUserMutationVariables,
    undefined
  );

  return newUser;
};
