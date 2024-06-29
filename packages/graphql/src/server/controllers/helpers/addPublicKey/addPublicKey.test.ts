import path from 'path';
import {addPublicKey} from '.';
import {getPathToKeyFolder} from 'passwordkeeper.crypto';
import {beforeAll, afterAll, describe, it} from '@jest/globals';
import {
  UserModel,
  connectToDB,
  AccountModel,
  PublicKeyModel,
  disconnectFromDB,
  AccountTypeModel
} from 'passwordkeeper.database';
import {
  areKeysEqual,
  normalizeKey,
  createTestUser,
  TestUserCreationData
} from '../../../utils/testHelpers';
import {
  UserRoles,
  type IUser,
  ValidAccountTypes,
  type DBConnection,
  type IUserDocument,
  type IPublicKeyDocument,
  type CreateUserMutationVariables
} from 'passwordkeeper.types';
import {Types} from 'mongoose';

// store variables needed to test the login invite process
let db: DBConnection;
let userPublicKey: string;
let testUser: IUserDocument;

// path to the test keys
const pathToKeys: string = path.join(
  getPathToKeyFolder()?.replace('.private', 'test-keys'),
  'addPublicKeyToUser'
);

// data to create a test user
const testUserCreationData: IUser = {
  username: 'testAddPublicKeyToUser',
  email: 'testAddPublicKeyToUser@test.com',
  userRole: UserRoles.ACCOUNT_OWNER
};

// variables to create a test user using graphql mutation
const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {username: testUserCreationData.username, email: testUserCreationData.email}
};

/**
 * Need to create a test user and keys for the login process
 */
beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');

  // create a test user
  const createTestUserResult: TestUserCreationData = await createTestUser({
    pathToKeys: pathToKeys,
    userRSAKeyName: 'addPublicKeyToUser',
    user: {...testUserCreationVariables}
  });

  testUser = createTestUserResult.createdAuthSession.user as IUserDocument;
  userPublicKey = createTestUserResult.userKeys.publicKey;
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('addPublicKeyToUser', () => {
  it('should be able to add a new public key to the user if the user has space', async () => {
    const newPublicKey = userPublicKey.replace('Z', 'y');
    // add the new public key to the user
    const updatedUserData = await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey
    });
    const updatedUserKeys: IPublicKeyDocument[] = updatedUserData.user.publicKeys;

    const addedKey = updatedUserKeys.find((key: IPublicKeyDocument) =>
      areKeysEqual(key.key, newPublicKey)
    );
    expect(addedKey).toBeDefined();
    expect(normalizeKey(addedKey?.key as string)).toEqual(normalizeKey(newPublicKey));
  });

  it('should throw an error if the user has reached the max number of public keys', async () => {
    const finalPublicKey = userPublicKey.replace('x', 'b');
    const shouldErrorKey = userPublicKey.replace('x', 'v');

    // add the final public key
    const goodUpdate = await addPublicKey({
      userId: testUser._id,
      publicKey: finalPublicKey
    });
    expect(goodUpdate).toBeDefined();
    try {
      await addPublicKey({
        userId: testUser._id,
        publicKey: shouldErrorKey
      });
    } catch (error) {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe('Error: Max number of public keys reached');
    }

    expect.assertions(3);
  });

  it('Should allow the user to add a new public key if they upgrade their account type', async () => {
    (
      await AccountModel.findOneAndUpdate(
        {
          owner: testUser._id
        },
        {
          accountType: await AccountTypeModel.findOne({type: ValidAccountTypes.PRO})
        },
        {
          new: true,
          runValidators: true
        }
      )
    )?.toObject();

    const newPublicKey = userPublicKey.replace('t', 'u');
    const updatedUserData = await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey
    });
    const updatedUserKeys = updatedUserData.user.publicKeys;
    const addedKey = updatedUserKeys?.find((key: IPublicKeyDocument) =>
      areKeysEqual(key.key, newPublicKey)
    );

    expect(updatedUserData).toBeDefined();
    expect(updatedUserKeys).toHaveLength(4);
    expect(addedKey).toBeDefined();
    expect(normalizeKey(addedKey?.key as string)).toEqual(normalizeKey(newPublicKey));
  });

  it('Should throw an error if the existing user is not found', async () => {
    const newPublicKey = userPublicKey.replace('t', 'b');

    // create a fake id
    const fakeObjectId = '60f1b9b3b3b3b3b3b3b3b3b3';
    const fakeId = new Types.ObjectId(fakeObjectId);

    await addPublicKey({
      userId: fakeId,
      publicKey: newPublicKey
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe('Error: User not found');
    });
  });

  it('Should throw an error if the new public key is not provided', async () => {
    const newPublicKey = '';

    await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe('ValidationError: key: Path `key` is required.');
    });
  });

  it('Should throw an error if the new public key is not a valid PEM key', async () => {
    const newPublicKey = 'not a valid PEM key';

    await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe(
        'ValidationError: key: Key must be a valid public key in PEM format.'
      );
    });
  });

  it('Should allow the user to add a new public key with a label and description', async () => {
    const newPublicKey = userPublicKey.replace('z', 'a');
    const label = 'test label';
    const description = 'test description';

    const updatedUserData = await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey,
      label,
      description
    });
    const updatedUserKeys = updatedUserData.user.publicKeys;

    const addedKey = updatedUserKeys.find(
      (key: IPublicKeyDocument) => key.label === label && key.description === description
    );

    expect(addedKey).toBeDefined();
    expect(addedKey?.label).toEqual(label);
    expect(addedKey?.description).toEqual(description);
    expect(normalizeKey(addedKey?.key as string)).toEqual(normalizeKey(newPublicKey));
  });

  it('Should throw an error if the label is not unique for the user', async () => {
    const newPublicKey = userPublicKey.replace('x', 'd');
    const label = 'test label';
    const description = 'test description';

    await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey,
      label,
      description
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe('ValidationError: label: Label must be unique for the user.');
    });
  });

  it('Should throw an error if the label is not valid', async () => {
    const newPublicKey = userPublicKey.replace('y', 'e');
    const label = 'invalid<>label';
    const description = 'test description';

    await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey,
      label,
      description
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe(
        'ValidationError: label: Label must contain only alphanumeric characters, spaces, dashes, underscores, or periods.'
      );
    });
  });

  it('Should throw an error if the label is too long', async () => {
    const newPublicKey = userPublicKey.replace('z', 'f');
    const label = 'a'.repeat(101);
    const description = 'test description';

    await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey,
      label,
      description
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe(
        'ValidationError: label: Path `label` (`' +
          label +
          '`) is longer than the maximum allowed length (100).'
      );
    });
  });

  it('should throw an error if the description is too long', async () => {
    const newPublicKey = userPublicKey.replace('z', 'g');
    const label = 'test label long description';
    const description = 'a'.repeat(501);

    await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey,
      label,
      description
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe(
        'ValidationError: description: Path `description` (`' +
          description +
          '`) is longer than the maximum allowed length (500).'
      );
    });
  });

  it('Should allow the user to add a new public key with an expiration date', async () => {
    const newPublicKey = userPublicKey.replace('z', 'h');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 33); // 30 days from now

    const updatedUserData = await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey,
      expiresAt
    });
    const updatedUserKeys = updatedUserData.user.publicKeys;

    const addedKey = updatedUserKeys.find(
      (key: IPublicKeyDocument) => key.expiresAt?.getTime() === expiresAt.getTime()
    );

    expect(addedKey).toBeDefined();
    expect(normalizeKey(addedKey?.key as string)).toEqual(normalizeKey(newPublicKey));
  });

  it('Should throw an error if the expiration date is in the past', async () => {
    const newPublicKey = userPublicKey.replace('z', 'i');
    const expiresAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 33); // 30 days ago

    await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey,
      expiresAt
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe(
        'ValidationError: expiresAt: Expiration date must be in the future!'
      );
    });
  });

  it('Should throw an error if the expiration date is not a date', async () => {
    const newPublicKey = userPublicKey.replace('z', 'j');
    const expires = 'not a date';

    await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey,
      // @ts-expect-error  - testing for error
      expiresAt: expires
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString()).toBe(
        'ValidationError: expiresAt: Cast to date failed for value "not a date" (type string) at path "expiresAt"'
      );
    });
  });

  it('Should throw an error if a the public key already exists', async () => {
    const newPublicKey = userPublicKey;

    await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey
    }).catch(error => {
      expect(error).toBeDefined();
      expect(error?.toString().includes('E11000')).toBeTruthy();
    });
  });

  it('Should allow the user to add a new public key as the default key', async () => {
    const newPublicKey = userPublicKey.replace('z', 'k');

    const updatedUserData = await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey,
      defaultKey: true
    });
    const updatedUserKeys = updatedUserData.user.publicKeys;

    const addedKey = updatedUserKeys.find(
      (key: IPublicKeyDocument) => areKeysEqual(key.key, newPublicKey) && key.default
    );

    expect(addedKey).toBeDefined();
    expect(addedKey?.default).toBeTruthy();
    expect(normalizeKey(addedKey?.key as string)).toEqual(normalizeKey(newPublicKey));
  });

  it('Should allow the user to add a new public key as the default key if it is the first key', async () => {
    // delete all the keys
    await PublicKeyModel.deleteMany({owner: testUser._id});
    await AccountModel.findOneAndUpdate(
      {owner: testUser._id},
      {publicKeys: []},
      {new: true, runValidators: true}
    );
    await UserModel.findByIdAndUpdate(
      {_id: testUser._id},
      {publicKeys: []},
      {new: true, runValidators: true}
    );

    const newPublicKey = userPublicKey.replace('z', 'l');

    const updatedUserData = await addPublicKey({
      userId: testUser._id,
      publicKey: newPublicKey
    });

    const updatedUserKeys = updatedUserData.user.publicKeys;

    const addedKey = updatedUserKeys.find(
      (key: IPublicKeyDocument) => areKeysEqual(key.key, newPublicKey) && key.default
    );

    expect(addedKey).toBeDefined();
    expect(addedKey?.default).toBeTruthy();
    expect(normalizeKey(addedKey?.key as string)).toEqual(normalizeKey(newPublicKey));
  });
});
