import path from 'path';
import {updatePublicKey} from '.';
import {getAuth} from '../../../../../middleware';
import {getPathToKeyFolder} from '../../../../../utils';
import {beforeAll, afterAll, describe, it} from '@jest/globals';
import {connectToDB, disconnectFromDB} from 'passwordkeeper.database';
import {
  normalizeKey,
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware
} from '../../../../../utils/testHelpers';
import {
  UserRoles,
  type IUser,
  type DBConnection,
  type IUserDocument,
  type IPublicKeyDocument,
  type IAuthSessionDocument,
  type CreateUserMutationVariables,
  type CompleteAccountMutationPayload,
  type UpdatePublicKeyMutationVariables
} from 'passwordkeeper.types';

let db: DBConnection;
let userPublicKey: string;
let testUser: IUserDocument;
let validSession: IAuthSessionDocument;
let authSession: CompleteAccountMutationPayload;
let createTestUserResult: TestUserCreationData;

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.updatePublicKeyMutation')
);

const testUserCreationData: IUser = {
  username: 'testUpdatePublicKeyMutation',
  email: 'testUpdatePublicKeyMutation@test.com',
  userRole: UserRoles.ACCOUNT_OWNER
};

// variables to create a test user using graphql mutation
const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {username: testUserCreationData.username, email: testUserCreationData.email}
};

// create a test user, generate their RSA keys, and create an AuthSession for them
beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');

  // create a test user
  createTestUserResult = await createTestUser({
    pathToKeys: pathToKeys,
    user: {...testUserCreationVariables},
    userRSAKeyName: 'updatePublicKeyMutation'
  });

  // set variables needed to use the AuthSession
  authSession = createTestUserResult.createdAuthSession;
  userPublicKey = createTestUserResult.userKeys.publicKey;
  testUser = createTestUserResult.createdAuthSession.user as IUserDocument;

  // generate the client-side session data the server expects for the AuthMiddleware
  const sessionData = await getSessionReadyForAuthMiddleware({
    authSession,
    keyName: 'updatePublicKeyMutation',
    testUserData: createTestUserResult
  });

  // set the variables needed to authenticate the user
  const sessionId: string = sessionData.sessionId as string;
  const signature: string = sessionData.signature as string;

  // create the headers needed for the auth middleware
  // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
  validSession = await getAuth({
    headers: {
      authorization: sessionId,
      signature
    }
  });
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('updatePublicKeyMutation', () => {
  it('should update the label on a public key', async () => {
    const updateKeyData: UpdatePublicKeyMutationVariables = {
      updatePublicKeyArgs: {
        id: testUser.publicKeys[0]._id.toString(),
        label: 'new label'
      }
    };

    const result = await updatePublicKey(undefined, updateKeyData, {session: validSession});

    expect(result.label).toEqual('new label');
  });

  it('should update the description on a public key', async () => {
    const updateKeyData: UpdatePublicKeyMutationVariables = {
      updatePublicKeyArgs: {
        id: testUser.publicKeys[0]._id.toString(),
        description: 'new description'
      }
    };

    const result = await updatePublicKey(undefined, updateKeyData, {session: validSession});

    expect(result.description).toEqual('new description');
  });

  it('should update the key on a public key', async () => {
    const newKey = userPublicKey.replace('x', 'y');
    const updateKeyData: UpdatePublicKeyMutationVariables = {
      updatePublicKeyArgs: {
        id: testUser.publicKeys[0]._id.toString(),
        key: newKey
      }
    };

    const result = await updatePublicKey(undefined, updateKeyData, {session: validSession});

    expect(normalizeKey(result.key)).toEqual(normalizeKey(newKey));
  });

  it('should throw an error if the key is not a valid RSA public key', async () => {
    const updateKeyData: UpdatePublicKeyMutationVariables = {
      updatePublicKeyArgs: {
        id: testUser.publicKeys[0]._id.toString(),
        key: 'not a valid key'
      }
    };

    await expect(
      updatePublicKey(undefined, updateKeyData, {session: validSession})
    ).rejects.toThrow('Error updating public key');
  });

  it('should throw an error if the user is trying to update a key with an existing key', async () => {
    const updateKeyData: UpdatePublicKeyMutationVariables = {
      updatePublicKeyArgs: {
        id: testUser.publicKeys[0]._id.toString(),
        key: userPublicKey.replace('x', 'y')
      }
    };

    await expect(
      updatePublicKey(undefined, updateKeyData, {session: validSession})
    ).rejects.toThrow('Error updating public key');
  });

  it('should update the expiresAt on a public key', async () => {
    const updateKeyData: UpdatePublicKeyMutationVariables = {
      updatePublicKeyArgs: {
        id: testUser.publicKeys[0]._id.toString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      }
    };

    const result = await updatePublicKey(undefined, updateKeyData, {session: validSession});

    expect(result.expiresAt).toEqual(updateKeyData.updatePublicKeyArgs.expiresAt);
  });

  it('should update the defaultKey on a public key', async () => {
    const updateKeyData: UpdatePublicKeyMutationVariables = {
      updatePublicKeyArgs: {
        id: testUser.publicKeys[0]._id.toString(),
        defaultKey: true
      }
    };

    const result = await updatePublicKey(undefined, updateKeyData, {session: validSession});

    expect(result.default).toEqual(true);

    // expect their to be only one default key and the default key to be the one we just updated
    const defaultKeys = testUser.publicKeys.filter((key: IPublicKeyDocument) => key?.default);

    expect(defaultKeys.length).toEqual(1);
    expect(defaultKeys[0]._id.toString()).toEqual(result._id.toString());
  });

  it('should throw an error if the user is not authenticated', async () => {
    const updateKeyData: UpdatePublicKeyMutationVariables = {
      updatePublicKeyArgs: {
        id: testUser.publicKeys[0]._id.toString(),
        label: 'new label'
      }
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    await expect(updatePublicKey(undefined, updateKeyData, {session: {}})).rejects.toThrow(
      'Error updating public key'
    );
  });
});
