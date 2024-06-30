import path from 'path';
import {addPublicKeyMutation} from '.';
import {getAuth} from '../../../../middleware';
import {getPathToKeyFolder} from 'passwordkeeper.crypto';
import {beforeAll, afterAll, describe, it} from '@jest/globals';
import {
  connectToDB,
  AccountModel,
  AccountTypeModel,
  disconnectFromDB
} from 'passwordkeeper.database';
import {
  normalizeKey,
  createTestUser,
  getSessionReadyForAuthMiddleware
} from '../../../../utils/testHelpers';
import {
  UserRoles,
  type IUser,
  ValidAccountTypes,
  type DBConnection,
  type IPublicKeyDocument,
  type IAuthSessionDocument,
  type CreateUserMutationVariables,
  type AddPublicKeyMutationPayload,
  type AddPublicKeyMutationVariables,
  CreateUserMutationPayload
} from 'passwordkeeper.types';

// store variables needed to test the login invite process
let db: DBConnection;
let sessionId: string;
let signature: string;
let userPublicKey: string;
let validSession: IAuthSessionDocument;
let authSession: CreateUserMutationPayload;

// path to the test keys
const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.addPublicKeyMutation')
);

// data to create a test user
const testUserCreationData: IUser = {
  username: 'addPublicKeyMutation',
  email: 'addPublicKeyMutation@test.com',
  userRole: UserRoles.ACCOUNT_OWNER
};

// variables to create a test user using graphql mutation
const testUserCreationVariables: CreateUserMutationVariables = {
  createUserArgs: {
    username: testUserCreationData.username,
    email: testUserCreationData.email,
    publicKey: ''
  }
};

/**
 * Need to create a test user and keys for the login process
 */
beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');

  // create a test user
  authSession = await createTestUser({
    pathToKeys: pathToKeys,
    userRSAKeyName: 'addPublicKeyMutation',
    user: {...testUserCreationVariables}
  });

  const pubKey = authSession?.user?.publicKeys?.[0]?.key as string;

  // testUser = createTestUserResult.createdAuthSession.user as IUserDocument;
  userPublicKey = pubKey;

  const sessionData = await getSessionReadyForAuthMiddleware({
    authSession,
    keyName: 'addPublicKeyMutation'
  });

  sessionId = sessionData.sessionId as string;
  signature = sessionData.signature as string;

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

describe('addPublicKeyMutation', () => {
  it('should add a public key to the user account', async () => {
    const newPublicKey = userPublicKey.replace('x', 'y');

    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        key: newPublicKey,
        label: 'testKey1',
        description: 'test key description',
        defaultKey: false
      }
    };

    const result: AddPublicKeyMutationPayload = await addPublicKeyMutation(
      undefined,
      publicKeyData,
      {session: validSession}
    );

    const addedKey: IPublicKeyDocument | undefined = result.user.publicKeys.find(
      (key: IPublicKeyDocument) => key._id.toString() === result.addedKeyId.toString()
    );

    expect(addedKey).toBeDefined();
    expect(normalizeKey(addedKey?.key as string)).toBe(normalizeKey(newPublicKey));
  });

  it('should add a public key to the user account and set it as the default key', async () => {
    const newPublicKey = userPublicKey.replace('x', 'z');

    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        key: newPublicKey,
        label: 'testKey2',
        description: 'test key description',
        defaultKey: true
      }
    };

    const result: AddPublicKeyMutationPayload = await addPublicKeyMutation(
      undefined,
      publicKeyData,
      {session: validSession}
    );

    const addedKey: IPublicKeyDocument | undefined = result.user.publicKeys.find(
      (key: IPublicKeyDocument) => key._id.toString() === result.addedKeyId.toString()
    );

    expect(addedKey).toBeDefined();
    expect(normalizeKey(addedKey?.key as string)).toBe(normalizeKey(newPublicKey));
    expect(addedKey?.default).toBe(true);
  });

  it('should not add a public key to the user account when the max number of keys has been reached', async () => {
    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        key: userPublicKey,
        label: 'testKey3',
        description: 'test key description',
        defaultKey: false
      }
    };

    try {
      await addPublicKeyMutation(undefined, publicKeyData, {session: validSession});
    } catch (error) {
      expect(String(error)).toBe('Error: Max number of public keys reached');
    }

    expect.assertions(1);
  });

  it('should not add a public key to the user account when the key is invalid', async () => {
    await AccountModel.findOneAndUpdate(
      {_id: validSession.user.account._id, owner: validSession.user._id},

      {
        $set: {
          accountType: (await AccountTypeModel.findOne({type: ValidAccountTypes.PRO}))?.toObject()
            ._id
        }
      },
      {new: true}
    ).populate({path: 'accountType'});

    //@ts-expect-error - testing invalid key
    validSession = await getAuth({
      headers: {
        authorization: sessionId,
        signature
      }
    });

    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        key: 'invalidKey',
        label: 'testKey4',
        description: 'test key description',
        defaultKey: false
      }
    };

    try {
      await addPublicKeyMutation(undefined, publicKeyData, {session: validSession});
    } catch (error) {
      expect(String(error)).toBe(
        'ValidationError: key: Key must be a valid public key in PEM format.'
      );
    }

    expect.assertions(1);
  });

  it('should not add a public key to the user account when the key is missing', async () => {
    const publicKeyData: AddPublicKeyMutationVariables = {
      //@ts-expect-error - testing missing key
      addPublicKeyArgs: {
        label: 'testKey5',
        description: 'test key description',
        defaultKey: false
      }
    };

    try {
      await addPublicKeyMutation(undefined, publicKeyData, {session: validSession});
    } catch (error) {
      expect(String(error)).toBe('Missing required fields');
    }

    expect.assertions(1);
  });

  it('should not add a public key to the user account when the user is not authenticated', async () => {
    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        key: userPublicKey,
        label: 'testKey6',
        description: 'test key description',
        defaultKey: false
      }
    };

    try {
      // @ts-expect-error - testing missing session
      await addPublicKeyMutation(undefined, publicKeyData, {session: {}});
    } catch (error) {
      expect(String(error)).toBe('Error: Not Authenticated');
    }

    expect.assertions(1);
  });

  it("should not add a public key to the user's account if the key is already in use", async () => {
    const newPublicKey = userPublicKey.replace('x', 'z');
    await AccountModel.findByIdAndUpdate(
      {_id: validSession.user.account._id},

      {
        accountType: (await AccountTypeModel.findOne({type: ValidAccountTypes.PRO}))?.toObject()._id
      },
      {new: true}
    ).populate({path: 'accountType'});

    //@ts-expect-error - testing invalid key
    validSession = await getAuth({
      headers: {
        authorization: sessionId,
        signature
      }
    });

    const publicKeyData: AddPublicKeyMutationVariables = {
      addPublicKeyArgs: {
        key: newPublicKey,
        label: 'testKey7',
        description: 'test key description',
        defaultKey: false
      }
    };

    try {
      await addPublicKeyMutation(undefined, publicKeyData, {session: validSession});
    } catch (error) {
      expect(String(error)).toBe('Public key already exists for this user');
    }

    expect.assertions(1);
  });
});
