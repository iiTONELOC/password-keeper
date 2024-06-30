import path from 'path';
import {deletePublicKey} from '.';
import {getAuth} from '../../../../middleware';
import {addPublicKeyMutation} from '../addPublicKey';
import {getPathToKeyFolder} from 'passwordkeeper.crypto';
import {beforeAll, afterAll, describe, it} from '@jest/globals';
import {PUBLIC_KEY_ERROR_MESSAGES} from '../../../../errors/messages';
import {connectToDB, PublicKeyModel, disconnectFromDB} from 'passwordkeeper.database';
import {createTestUser, getSessionReadyForAuthMiddleware} from '../../../../utils/testHelpers';
import {
  UserRoles,
  type IUser,
  type DBConnection,
  type IAuthSessionDocument,
  type CreateUserMutationVariables,
  type AddPublicKeyMutationPayload,
  type AddPublicKeyMutationVariables,
  CreateUserMutationPayload
} from 'passwordkeeper.types';

let db: DBConnection;
let userPublicKey: string;
let validSession: IAuthSessionDocument;
let addedKey: AddPublicKeyMutationPayload;
let authSession: CreateUserMutationPayload;

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.deletePublicKeyMutation')
);

const testUserCreationData: IUser = {
  username: 'deletePublicKeyMutation',
  email: 'deletePublicKeyMutation@test.com',
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

// create a test user, generate their RSA keys, and create an AuthSession for them
beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');

  // create a test user
  authSession = await createTestUser({
    pathToKeys: pathToKeys,
    user: {...testUserCreationVariables},
    userRSAKeyName: 'deletePublicKeyMutation'
  });

  // set variables needed to use the AuthSession
  const pubKey = authSession?.user?.publicKeys?.[0]?.key as string;
  userPublicKey = pubKey;

  // generate the client-side session data the server expects for the AuthMiddleware
  const sessionData = await getSessionReadyForAuthMiddleware({
    authSession,
    keyName: 'deletePublicKeyMutation'
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

  const newPublicKey = userPublicKey.replace('x', 'y');

  const publicKeyData: AddPublicKeyMutationVariables = {
    addPublicKeyArgs: {
      key: newPublicKey,
      label: 'testKey1',
      description: 'test key description',
      defaultKey: false
    }
  };

  addedKey = await addPublicKeyMutation(undefined, publicKeyData, {
    session: validSession
  });
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('deletePublicKey', () => {
  it('should delete a public key from the user account', async () => {
    const result = await deletePublicKey(
      undefined,
      {deletePublicKeyArgs: {id: addedKey.addedKeyId.toString()}},
      {session: validSession}
    );

    expect(result._id.toString()).toEqual(addedKey.addedKeyId.toString());
  });

  it('should throw an error if the public key does not exist', async () => {
    try {
      const fakeObjectId = '60f1b9b3b3b3b3b3b3b3b3b3';
      await deletePublicKey(
        undefined,
        {deletePublicKeyArgs: {id: fakeObjectId}},
        {session: validSession}
      );
    } catch (error) {
      expect(String(error)).toEqual(PUBLIC_KEY_ERROR_MESSAGES.NOT_FOUND);
    }
  });

  it('should throw an error if the public key is the default key', async () => {
    try {
      const defaultKeyID = authSession?.user?.publicKeys?.[0]?._id.toString();
      await deletePublicKey(
        undefined,
        {deletePublicKeyArgs: {id: defaultKeyID as string}},
        {session: validSession}
      );
    } catch (error) {
      expect(String(error)).toEqual(PUBLIC_KEY_ERROR_MESSAGES.CANNOT_DELETE_DEFAULT_KEY);
    }
  });

  it('should throw an error if the public key is the last key', async () => {
    try {
      const modifiedKey = await PublicKeyModel.findOneAndUpdate(
        {_id: authSession?.user?.publicKeys?.[0]?._id.toString(), owner: authSession.user._id},
        {$set: {default: false}}
      );
      await deletePublicKey(
        undefined,
        {deletePublicKeyArgs: {id: modifiedKey?._id.toString() as string}},
        {session: validSession}
      );
    } catch (error) {
      expect(String(error)).toEqual(PUBLIC_KEY_ERROR_MESSAGES.LAST_KEY);
    }
  });
});
