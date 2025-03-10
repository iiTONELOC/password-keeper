import {createUser} from '../../index';
import {USER_ERROR_MESSAGES} from '../../../../errors/messages';
import {connectToDB, disconnectFromDB} from 'passwordkeeper.database';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {
  UserRoles,
  type IUser,
  type IUserDocument,
  type DBConnection,
  type CreateUserMutationPayload,
  type CreateUserMutationVariables
} from 'passwordkeeper.types';

const testUserCreationData: IUser = {
  username: 'testCreateUser',
  email: 'testuser@test.com',
  userRole: UserRoles.ACCOUNT_OWNER
};

const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {username: testUserCreationData.username, email: testUserCreationData.email}
};

let db: DBConnection;

beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('createUser', () => {
  it('should create a user and an account completion invite', async () => {
    const result: CreateUserMutationPayload = await createUser(
      undefined,
      testUserCreationVariables,
      undefined
    );
    const user: IUserDocument = result.user;
    const now = new Date();

    const expirationDate = new Date(result.inviteToken.expiresAt);
    const diff = expirationDate.getTime() - now.getTime();

    expect(user).toBeDefined();
    expect(user.username).toBe(testUserCreationData.username);
    expect(user.email).toBe(testUserCreationData.email);
    expect(result.inviteToken).toBeDefined();
    expect(result.inviteToken.token).toBeDefined();
    expect(result.inviteToken.expiresAt).toBeDefined();
    expect(diff).toBeGreaterThan(1000 * 60 * 60 * 23);
    expect(diff).toBeLessThanOrEqual(1000 * 60 * 60 * 24);

    expect.assertions(8);
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
      createUserArgs: {username: 'testCreateUser2', email: ''}
    };

    try {
      await createUser(undefined, newUserData, undefined);
      // eslint-disable-next-line
    } catch (error: any) {
      expect(error.message).toBe(USER_ERROR_MESSAGES.EMAIL_REQUIRED);
    }
  });

  it('should throw an error if both username and email are not provided', async () => {
    const newUserData: CreateUserMutationVariables = {createUserArgs: {username: '', email: ''}};

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
