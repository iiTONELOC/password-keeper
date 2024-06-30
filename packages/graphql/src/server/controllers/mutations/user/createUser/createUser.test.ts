import path from 'path';
import {createUser} from '../../index';
import {USER_ERROR_MESSAGES} from '../../../../errors/messages';
import {connectToDB, disconnectFromDB} from 'passwordkeeper.database';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {generateRSAKeys, getPathToKeyFolder} from 'passwordkeeper.crypto';
import {
  UserRoles,
  type IUser,
  type DBConnection,
  type IUserDocument,
  type GeneratedRSAKeys,
  type CreateUserMutationPayload,
  type CreateUserMutationVariables
  // IAuthSession
} from 'passwordkeeper.types';

const testUserCreationData: IUser = {
  username: 'testCreateUser',
  email: 'testuser@test.com',
  userRole: UserRoles.ACCOUNT_OWNER
};

// path to the test keys
const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'testCreateUser'),
  'addPublicKeyToUser'
);

const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {
    publicKey: '',
    email: testUserCreationData.email,
    username: testUserCreationData.username
  }
};

let db: DBConnection;
let testUserKeys: GeneratedRSAKeys;

beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('createUser', () => {
  it('should create a user and an account completion invite', async () => {
    testUserKeys = (await generateRSAKeys('testCreateUser', {
      privateKeyPath: pathToKeys,
      publicKeyPath: pathToKeys
    })) as GeneratedRSAKeys;

    testUserCreationVariables.createUserArgs.publicKey = testUserKeys.publicKey;

    const result: CreateUserMutationPayload = await createUser(
      undefined,
      testUserCreationVariables,
      undefined
    );
    const user: IUserDocument = result.user as IUserDocument;
    expect(user).toBeDefined();
    expect(user.username).toBe(testUserCreationData.username);
    expect(user.email).toBe(testUserCreationData.email);

    expect.assertions(3);
  });

  it('should throw an error if no username is provided', async () => {
    const testVariables: CreateUserMutationVariables = {
      ...testUserCreationVariables,
      createUserArgs: {...testUserCreationVariables.createUserArgs, username: ''}
    };

    try {
      await createUser(undefined, testVariables, undefined);
      // eslint-disable-next-line
    } catch (error: any) {
      expect(error.message).toBe(USER_ERROR_MESSAGES.USERNAME_REQUIRED);
    }
  });

  it('should throw an error if no email is provided', async () => {
    const newUserData: CreateUserMutationVariables = {
      createUserArgs: {username: 'testCreateUser2', email: '', publicKey: ''}
    };

    try {
      await createUser(undefined, newUserData, undefined);
      // eslint-disable-next-line
    } catch (error: any) {
      expect(error.message).toBe(USER_ERROR_MESSAGES.EMAIL_REQUIRED);
    }
  });

  it('should throw an error if both username and email are not provided', async () => {
    const newUserData: CreateUserMutationVariables = {
      createUserArgs: {username: '', email: '', publicKey: ''}
    };

    try {
      await createUser(undefined, newUserData, undefined);
      // eslint-disable-next-line
    } catch (error: any) {
      expect(error.message).toBe(USER_ERROR_MESSAGES.USERNAME_REQUIRED);
    }
  });

  it('should throw an error if the user already exists', async () => {
    try {
      await createUser(undefined, testUserCreationVariables, undefined);
      // eslint-disable-next-line
    } catch (error: any) {
      expect(error.message).toBe(USER_ERROR_MESSAGES.ALREADY_EXISTS);
    }
  });
});
