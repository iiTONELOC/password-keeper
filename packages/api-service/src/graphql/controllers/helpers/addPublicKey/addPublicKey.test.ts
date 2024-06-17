import path from 'path';
import {addPublicKey} from '.';
import {UserModel} from '../../../../db/Models';
import {createTestUser} from '../../testHelpers';
import {beforeAll, afterAll} from '@jest/globals';
import {getPathToKeyFolder} from '../../../../utils';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';
import type {
  IUser,
  DBConnection,
  IUserDocument,
  GeneratedRSAKeys,
  CreateUserMutationVariables,
  IPublicKeyDocument
} from 'passwordkeeper.types';

// store variables needed to test the login invite process
let db: DBConnection;
let testUser: IUserDocument;
let testUserKeys: GeneratedRSAKeys;

// path to the test keys
const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'test-keys'),
  'completeLogin'
);

// data to create a test user
const testUserCreationData: IUser = {
  username: 'testAddPublicKeyToUser',
  email: 'testAddPublicKeyToUser@test.com'
};

// variables to create a test user using graphql mutation
const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {username: testUserCreationData.username, email: testUserCreationData.email}
};

/**
 * Need to create a test user and keys for the login process
 */
beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');

  // create a test user
  const createTestUserResult = await createTestUser({
    pathToKeys: pathToKeys,
    userRSAKeyName: 'completeLogin',
    user: {...testUserCreationVariables}
  });

  testUserKeys = createTestUserResult.userKeys;
  testUser = createTestUserResult.createdAuthSession.user as IUserDocument;
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('addPublicKeyToUser', () => {
  it('should be able to add a new public key to the user if the user has space', async () => {
    const newPublicKey = 'newPublicKey';

    // add the new public key to the user

    await addPublicKey(testUser._id, newPublicKey);

    // check that the user has the new public key
    const updatedUserKeys = (
      await UserModel.findById(testUser._id).select('publicKeys').populate('publicKeys')
    )?.toObject() as IUserDocument;

    expect(updatedUserKeys?.publicKeys).toHaveLength(2);

    const addedKey = updatedUserKeys?.publicKeys?.find(
      key => (key as unknown as IPublicKeyDocument)?.key === newPublicKey
    ) as IPublicKeyDocument | undefined;
    expect(addedKey).toBeDefined();
    expect(addedKey?.key).toBe(newPublicKey);
  });

  it('should throw an error if the user has reached the max number of public keys', async () => {
    const finalPublicKey = 'finalPublicKey';
    const shouldErrorKey = 'shouldErrorKey';

    // add the final public key
    const goodUpdate = await addPublicKey(testUser._id, finalPublicKey);
    expect(goodUpdate).toBeDefined();
    try {
      await addPublicKey(testUser._id, shouldErrorKey);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe('Error: Max number of public keys reached');
    }
  });

  it('Should allow the user to add a new public key if they upgrade their account type', async () => {
    await UserModel.findByIdAndUpdate(testUser._id, {
      accountType: 'PRO'
    }).select('accountType');

    const newPublicKey = 'newPublicKey';
    const updatedUser = await addPublicKey(testUser._id, newPublicKey);

    expect(updatedUser).toBeDefined();

    const updatedUserKeys = (
      await UserModel.findById(testUser._id).select('publicKeys').populate('publicKeys')
    )?.toObject() as IUserDocument;

    expect(updatedUserKeys?.publicKeys).toHaveLength(4);

    const addedKey = updatedUserKeys?.publicKeys?.find(
      key => (key as unknown as IPublicKeyDocument)?.key === newPublicKey
    ) as IPublicKeyDocument | undefined;

    expect(addedKey).toBeDefined();

    expect(addedKey?.key).toBe(newPublicKey);
  });
});
