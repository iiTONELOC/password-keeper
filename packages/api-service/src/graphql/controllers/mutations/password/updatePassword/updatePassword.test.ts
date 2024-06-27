import path from 'path';
import {Types} from 'mongoose';
import {updatePassword} from '.';
import {addPassword} from '../addPassword';
import {getAuth} from '../../../../../middleware';
import {getPathToKeyFolder} from '../../../../../utils';
import {encryptAES} from '../../../../../utils/crypto/aes-256';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import {connectToDB, disconnectFromDB, EncryptedUserPasswordModel} from 'passwordkeeper.database';
import {
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware,
  decryptPasswordToOriginalData,
  PlainTextPassword
} from '../../../../../utils/testHelpers';
import {
  IPassword,
  DBConnection,
  IPasswordEncrypted,
  IAuthSessionDocument,
  IUserPasswordDocument,
  CreateUserMutationVariables,
  AddPasswordMutationVariables,
  CompleteAccountMutationPayload,
  UpdatePasswordMutationVariables
} from 'passwordkeeper.types';

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.updatePassWordMutation')
);

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'updatePassWordMutationTestUser',
    email: 'updatePassWordMutationTestUser@test.com'
  }
};

let db: DBConnection;
let sessionId: string;
let signature: string;
let testPassword: IPasswordEncrypted;
let testUserData: TestUserCreationData;
let authSession: CompleteAccountMutationPayload;

const testAESKey = 'updatePassWordMutationTestAESKey';

beforeAll(async () => {
  db = await connectToDB('pwd-keeper-test');
  testUserData = await createTestUser({
    pathToKeys,
    userRSAKeyName: 'updatePassWordMutation',
    user: testUserCreationData
  });

  // get the created auth session for the test user
  authSession = testUserData.createdAuthSession;
  const sessionData = await getSessionReadyForAuthMiddleware({
    testUserData,
    authSession,
    keyName: 'updatePassWordMutation'
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
  it("should update a user's password", async () => {
    const encryptedUpdatedPassword = await encryptAES('updatedPassword', testAESKey);
    const updatePasswordData: UpdatePasswordMutationVariables = {
      updatePasswordArgs: {
        id: testPassword._id?.toString() as string,
        password: {
          encryptedData: encryptedUpdatedPassword.encryptedData,
          iv: encryptedUpdatedPassword.iv
        }
      }
    };

    // get the session data the AuthContext expects
    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const updatedPassword = await updatePassword(undefined, updatePasswordData, {
      session: validSession
    });

    expect(updatedPassword).toBeDefined();
    expect(updatedPassword._id).toBeDefined();
    expect(updatedPassword.password).toBeDefined();
    expect(updatedPassword.password).not.toEqual(testPassword.password);
    expect(updatedPassword.password).toEqual(encryptedUpdatedPassword);

    // the user's encrypted data is JSON stringified before being encrypted, so we have to decrypt the string
    // and then parse the JSON before we can decrypt the data using the user's AES key
    let modifiedPassword: IUserPasswordDocument | PlainTextPassword = (
      await EncryptedUserPasswordModel.findById({_id: updatedPassword._id})
    )?.toObject() as IUserPasswordDocument;

    if (!modifiedPassword) {
      throw new Error('Password not found');
    }

    modifiedPassword = await decryptPasswordToOriginalData(testAESKey, modifiedPassword);

    expect(modifiedPassword.password).toEqual('updatedPassword');
    expect(modifiedPassword.url).toEqual('https://www.test.com');
    expect(modifiedPassword.name).toEqual('test');
    expect(modifiedPassword.owner.toString()).toEqual(
      testUserData.createdAuthSession.user._id?.toString()
    );
  });

  it('should update a user password with a new url', async () => {
    const encryptedUpdatedUrl = await encryptAES('https://www.updated.com', testAESKey);
    const updatePasswordData: UpdatePasswordMutationVariables = {
      updatePasswordArgs: {
        id: testPassword._id?.toString() as string,
        url: {
          encryptedData: encryptedUpdatedUrl.encryptedData,
          iv: encryptedUpdatedUrl.iv
        }
      }
    };

    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const updatedPassword = await updatePassword(undefined, updatePasswordData, {
      session: validSession
    });

    expect(updatedPassword).toBeDefined();

    let modifiedPassword: IUserPasswordDocument | PlainTextPassword = (
      await EncryptedUserPasswordModel.findById({_id: updatedPassword._id})
    )?.toObject() as IUserPasswordDocument;

    if (!modifiedPassword) {
      throw new Error('Password not found');
    }

    modifiedPassword = await decryptPasswordToOriginalData(testAESKey, modifiedPassword);

    expect(modifiedPassword.url).toEqual('https://www.updated.com');
    expect(modifiedPassword.password).toEqual('updatedPassword');
    expect(modifiedPassword.name).toEqual('test');
    expect(modifiedPassword.username).toEqual('test');

    expect(modifiedPassword.owner.toString()).toEqual(
      testUserData.createdAuthSession.user._id?.toString()
    );
  });

  it('should update a user password with a new name', async () => {
    const encryptedUpdatedName = await encryptAES('updatedName', testAESKey);

    const updatePasswordData: UpdatePasswordMutationVariables = {
      updatePasswordArgs: {
        id: testPassword._id?.toString() as string,
        name: {
          encryptedData: encryptedUpdatedName.encryptedData,
          iv: encryptedUpdatedName.iv
        }
      }
    };

    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const updatedPassword = await updatePassword(undefined, updatePasswordData, {
      session: validSession
    });

    expect(updatedPassword).toBeDefined();

    let modifiedPassword: IUserPasswordDocument | PlainTextPassword = (
      await EncryptedUserPasswordModel.findById({_id: updatedPassword._id})
    )?.toObject() as IUserPasswordDocument;

    if (!modifiedPassword) {
      throw new Error('Password not found');
    }

    modifiedPassword = await decryptPasswordToOriginalData(testAESKey, modifiedPassword);

    expect(modifiedPassword.name).toEqual('updatedName');
    expect(modifiedPassword.url).toEqual('https://www.updated.com');
    expect(modifiedPassword.password).toEqual('updatedPassword');
    expect(modifiedPassword.username).toEqual('test');
    expect(modifiedPassword.owner.toString()).toEqual(
      testUserData.createdAuthSession.user._id?.toString()
    );
  });

  it('should update a user password with a new username', async () => {
    const encryptedUpdatedUsername = await encryptAES('updatedUsername', testAESKey);

    const updatePasswordData: UpdatePasswordMutationVariables = {
      updatePasswordArgs: {
        id: testPassword._id?.toString() as string,
        username: {
          encryptedData: encryptedUpdatedUsername.encryptedData,
          iv: encryptedUpdatedUsername.iv
        }
      }
    };

    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const updatedPassword = await updatePassword(undefined, updatePasswordData, {
      session: validSession
    });

    expect(updatedPassword).toBeDefined();

    let modifiedPassword: IUserPasswordDocument | PlainTextPassword = (
      await EncryptedUserPasswordModel.findById({_id: updatedPassword._id})
    )?.toObject() as IUserPasswordDocument;

    if (!modifiedPassword) {
      throw new Error('Password not found');
    }

    modifiedPassword = await decryptPasswordToOriginalData(testAESKey, modifiedPassword);

    expect(modifiedPassword.username).toEqual('updatedUsername');

    expect(modifiedPassword.name).toEqual('updatedName');
    expect(modifiedPassword.url).toEqual('https://www.updated.com');
    expect(modifiedPassword.password).toEqual('updatedPassword');
    expect(modifiedPassword.owner.toString()).toEqual(
      testUserData.createdAuthSession.user._id?.toString()
    );
  });

  it('should update a user password with a new expiration date', async () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    const updatePasswordData: UpdatePasswordMutationVariables = {
      updatePasswordArgs: {
        id: testPassword._id?.toString() as string,
        expiresAt: expiresAt
      }
    };

    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const updatedPassword = await updatePassword(undefined, updatePasswordData, {
      session: validSession
    });

    expect(updatedPassword).toBeDefined();

    let modifiedPassword: IUserPasswordDocument | PlainTextPassword = (
      await EncryptedUserPasswordModel.findById({_id: updatedPassword._id})
    )?.toObject() as IUserPasswordDocument;

    if (!modifiedPassword) {
      throw new Error('Password not found');
    }

    modifiedPassword = await decryptPasswordToOriginalData(testAESKey, modifiedPassword);

    expect(modifiedPassword.expiresAt).toBeDefined();
    expect(modifiedPassword.expiresAt).toEqual(expiresAt);
    expect(modifiedPassword.username).toEqual('updatedUsername');
    expect(modifiedPassword.name).toEqual('updatedName');
    expect(modifiedPassword.url).toEqual('https://www.updated.com');
    expect(modifiedPassword.password).toEqual('updatedPassword');
    expect(modifiedPassword.owner.toString()).toEqual(
      testUserData.createdAuthSession.user._id?.toString()
    );
  });

  it('should throw an error if no fields are provided', async () => {
    const updatePasswordData: UpdatePasswordMutationVariables = {
      updatePasswordArgs: {
        id: testPassword._id?.toString() as string
      }
    };

    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    await expect(
      updatePassword(undefined, updatePasswordData, {
        session: validSession
      })
    ).rejects.toThrow('Must provide at least one field to update');
  });

  it('should throw an error if the password is not found', async () => {
    const updatePasswordData: UpdatePasswordMutationVariables = {
      updatePasswordArgs: {
        id: '123456789012345678901234',
        password: {
          encryptedData: 'test',
          iv: 'test'
        }
      }
    };

    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    await expect(
      updatePassword(undefined, updatePasswordData, {
        session: validSession
      })
    ).rejects.toThrow('Password not found');
  });

  it('should throw an error if the password id is not provided', async () => {
    const updatePasswordData: UpdatePasswordMutationVariables = {
      // @ts-expect-error - we are testing and don't need to pass in a real request
      updatePasswordArgs: {
        url: {encryptedData: 'test', iv: 'test'}
      }
    };

    // @ts-expect-error - we are testing and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    await expect(
      updatePassword(undefined, updatePasswordData, {
        session: validSession
      })
    ).rejects.toThrow('Missing required fields');
  });

  it('should throw an error if the user is not authenticated', async () => {
    const updatePasswordData: UpdatePasswordMutationVariables = {
      updatePasswordArgs: {
        id: testPassword._id?.toString() as string,
        password: {
          encryptedData: 'test',
          iv: 'test'
        }
      }
    };

    await expect(
      // @ts-expect-error - we are testing and don't need to pass in a real request
      updatePassword(undefined, updatePasswordData, {session: undefined})
    ).rejects.toThrow('Not Authenticated');
  });
});
