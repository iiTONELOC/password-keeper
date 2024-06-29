import path from 'path';
import {Types} from 'mongoose';
import {deletePassword} from '.';
import {addPassword} from '../addPassword';
import {getAuth} from '../../../../middleware';
import {encryptAES, getPathToKeyFolder} from 'passwordkeeper.crypto';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {
  connectToDB,
  AccountModel,
  disconnectFromDB,
  EncryptedUserPasswordModel
} from 'passwordkeeper.database';
import {
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware
} from '../../../../utils/testHelpers';
import {
  IPassword,
  DBConnection,
  IPasswordEncrypted,
  IAuthSessionDocument,
  CreateUserMutationVariables,
  AddPasswordMutationVariables,
  CompleteAccountMutationPayload
} from 'passwordkeeper.types';

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.deletePassword')
);

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'deletePasswordTestUser',
    email: 'deletePasswordTestUser@test.com'
  }
};

let db: DBConnection;
let sessionId: string;
let signature: string;
let testPassword: IPasswordEncrypted;
let testUserData: TestUserCreationData;
let authSession: CompleteAccountMutationPayload;

const testAESKey = 'deletePasswordTestAESKey';

beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');
  testUserData = await createTestUser({
    pathToKeys,
    userRSAKeyName: 'deletePassword',
    user: testUserCreationData
  });

  // get the created auth session for the test user
  authSession = testUserData.createdAuthSession;
  const sessionData = await getSessionReadyForAuthMiddleware({
    testUserData,
    authSession,
    keyName: 'deletePassword'
  });
  sessionId = sessionData.sessionId as string;
  signature = sessionData.signature as string;

  // create a password to update

  // password data
  const passwordData: IPassword = {
    url: 'https://www.test.com',
    name: 'test',
    username: 'test',
    password: 'test',
    owner: testUserData.createdAuthSession.user._id as Types.ObjectId
  };

  // encrypt the password data as if it came from the client
  const [encryptedUrl, encryptedName, encryptedUsername, encryptedPassword] = await Promise.all([
    encryptAES(passwordData.url as string, testAESKey),
    encryptAES(passwordData.name, testAESKey),
    encryptAES(passwordData.username, testAESKey),
    encryptAES(passwordData.password, testAESKey)
  ]);

  // create the addPasswordArgs the mutation expects
  const addPasswordData: AddPasswordMutationVariables = {
    addPasswordArgs: {
      url: {encryptedData: encryptedUrl.encryptedData, iv: encryptedUrl.iv},
      name: {encryptedData: encryptedName.encryptedData, iv: encryptedName.iv},
      username: {encryptedData: encryptedUsername.encryptedData, iv: encryptedUsername.iv},
      password: {encryptedData: encryptedPassword.encryptedData, iv: encryptedPassword.iv}
    }
  };

  // get the session data the AuthContext expects
  // @ts-expect-error - we are testing and don't need to pass in a real request
  const validSession: IAuthSessionDocument = await getAuth({
    headers: {authorization: sessionId, signature}
  });

  // create the password
  testPassword = await addPassword(undefined, addPasswordData, {
    session: validSession
  });
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('updatePassWordMutation', () => {
  it('should delete a password', async () => {
    // get the session data the AuthContext expects
    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const deletePasswordData = await deletePassword(
      undefined,
      {passwordId: testPassword._id?.toString() as string},
      {session: validSession}
    );

    // check that the password was deleted
    const deletedPassword = await EncryptedUserPasswordModel.findOne({_id: testPassword._id});

    expect(deletedPassword).toBeNull();
    expect(deletePasswordData).toEqual({...testPassword, expiresAt: undefined, __v: 0});
  });

  it('should throw an error if the password does not exist', async () => {
    // get the session data the AuthContext expects
    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const fakePasswordId = new Types.ObjectId().toString();
    const deletePasswordData = deletePassword(
      undefined,
      {passwordId: fakePasswordId},
      {session: validSession}
    );

    await expect(deletePasswordData).rejects.toThrow('Password not found');
  });

  it('should throw an error if the passwordId is not provided', async () => {
    // get the session data the AuthContext expects
    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const deletePasswordData = deletePassword(
      undefined,
      // @ts-expect-error - we are testing and don't need to pass in a real request
      {passwordId: undefined},
      {session: validSession}
    );

    await expect(deletePasswordData).rejects.toThrow('Missing required fields');
  });

  it('should throw an error if the user does not own the password', async () => {
    const newUserCreationData: CreateUserMutationVariables = {
      createUserArgs: {
        username: 'deletePasswordTestUser2',
        email: 'deletePasswordTestUser2@test.com'
      }
    };

    const newUser = await createTestUser({
      user: newUserCreationData,
      userRSAKeyName: 'deletePassword2',
      pathToKeys: pathToKeys.replace('.deletePassword', '.deletePassword2')
    });

    const sessionData = await getSessionReadyForAuthMiddleware({
      testUserData: newUser,
      authSession: newUser.createdAuthSession,
      keyName: 'deletePassword2'
    });

    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validAuthSession2: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionData.sessionId, signature: sessionData.signature}
    });

    // create a new password for this new user
    const newPasswordData: IPassword = {
      url: 'https://www.test.com',
      name: 'test',
      username: 'test',
      password: 'test',
      owner: newUser.createdAuthSession.user._id as Types.ObjectId
    };

    // encrypt the password data as if it came from the client
    const [encryptedUrl, encryptedName, encryptedUsername, encryptedPassword] = await Promise.all([
      encryptAES(newPasswordData.url as string, testAESKey),
      encryptAES(newPasswordData.name, testAESKey),
      encryptAES(newPasswordData.username, testAESKey),
      encryptAES(newPasswordData.password, testAESKey)
    ]);

    // create the addPasswordArgs the mutation expects
    const addPasswordData: AddPasswordMutationVariables = {
      addPasswordArgs: {
        url: {encryptedData: encryptedUrl.encryptedData, iv: encryptedUrl.iv},
        name: {encryptedData: encryptedName.encryptedData, iv: encryptedName.iv},
        username: {encryptedData: encryptedUsername.encryptedData, iv: encryptedUsername.iv},
        password: {encryptedData: encryptedPassword.encryptedData, iv: encryptedPassword.iv}
      }
    };

    // create the password
    const newPassword = await addPassword(undefined, addPasswordData, {
      session: validAuthSession2
    });

    // try to delete the password using the first user's session
    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    try {
      await deletePassword(
        undefined,
        {passwordId: newPassword._id?.toString() as string},
        {session: validSession}
      );
      // eslint-disable-next-line
    } catch (error: any) {
      expect(error?.message).toBe('Password not found');
    }
  });

  it('should throw an error if the user is not authenticated', async () => {
    // @ts-expect-error - we are testing and don't need to pass in a real request
    const deletePasswordData = deletePassword(undefined, {passwordId: 'test'}, {});

    await expect(deletePasswordData).rejects.toThrow('Not Authenticated');
  });

  it('should be removed from the account passwords array', async () => {
    // get the session data the AuthContext expects
    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const userAccount = await AccountModel.findById(validSession.user.account._id);

    //expect the deleted password to be removed from the account passwords array
    expect(userAccount?.passwords).not.toContain(testPassword._id);
  });
});
