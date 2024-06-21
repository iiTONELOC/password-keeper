import path from 'path';
import {addPassword} from '.';
import {Types} from 'mongoose';
import {getAuth} from '../../../../middleware';
import {getPathToKeyFolder} from '../../../../utils';
import {encryptAES} from '../../../../utils/crypto/aes-256';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';
import dbConnection, {disconnectFromDB} from '../../../../db/connection';
import {
  createTestUser,
  TestUserCreationData,
  getSessionReadyForAuthMiddleware
} from '../../../../utils/testHelpers';
import {
  IPassword,
  DBConnection,
  ValidAccountTypes,
  IPasswordEncrypted,
  IAuthSessionDocument,
  CreateUserMutationVariables,
  AddPasswordMutationVariables,
  CompleteAccountMutationPayload
} from 'passwordkeeper.types';
import {AccountTypeMap, AccountTypeModel, UserModel} from '../../../../db/Models';

const pathToKeys: string = path.normalize(
  getPathToKeyFolder()?.replace('.private', '.addPassWordMutation')
);

const testUserCreationData: CreateUserMutationVariables = {
  createUserArgs: {
    username: 'addPassWordMutationTestUser',
    email: 'addPassWordMutationTestUser@test.com'
  }
};

let db: DBConnection;
let testUserData: TestUserCreationData;
let authSession: CompleteAccountMutationPayload;
let sessionId: string;
let signature: string;

const testAESKey = 'addPassWordMutationTestAESKey';

beforeAll(async () => {
  db = await dbConnection('pwd-keeper-test');
  testUserData = await createTestUser({
    pathToKeys,
    userRSAKeyName: 'addPassWordMutation',
    user: testUserCreationData
  });

  // get the created auth session for the test user
  authSession = testUserData.createdAuthSession;
  const sessionData = await getSessionReadyForAuthMiddleware({
    testUserData,
    authSession,
    keyName: 'addPassWordMutation'
  });
  sessionId = sessionData.sessionId as string;
  signature = sessionData.signature as string;
});

afterAll(async () => {
  db && (await disconnectFromDB(db));
});

describe('addPassWordMutation', () => {
  it('should add a password to the user', async () => {
    const passwordData: IPassword = {
      url: 'https://www.test.com',
      name: 'test',
      username: 'test',
      password: 'test',
      owner: testUserData.createdAuthSession.user._id as Types.ObjectId
    };

    const [encryptedUrl, encryptedName, encryptedUsername, encryptedPassword] = await Promise.all([
      encryptAES(passwordData.url as string, testAESKey),
      encryptAES(passwordData.name, testAESKey),
      encryptAES(passwordData.username, testAESKey),
      encryptAES(passwordData.password, testAESKey)
    ]);

    const addPasswordData: AddPasswordMutationVariables = {
      addPasswordArgs: {
        url: {encryptedData: encryptedUrl.encryptedData, iv: encryptedUrl.iv},
        name: {encryptedData: encryptedName.encryptedData, iv: encryptedName.iv},
        username: {encryptedData: encryptedUsername.encryptedData, iv: encryptedUsername.iv},
        password: {encryptedData: encryptedPassword.encryptedData, iv: encryptedPassword.iv}
      }
    };
    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    const result: IPasswordEncrypted = await addPassword(undefined, addPasswordData, {
      session: validSession
    });

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(result.name).toBeDefined();
    expect(result.username).toBeDefined();
    expect(result.password).toBeDefined();
    expect(result.owner).toBeDefined();
    expect(result.expiresAt).toBeUndefined();
    expect(result.owner.toString()).toBe(testUserData.createdAuthSession.user._id?.toString());
  });

  it('should throw an error if name is missing', async () => {
    const passwordData: IPassword = {
      url: 'https://www.test.com',
      // @ts-expect-error - we are testing bad input
      name: undefined,
      username: 'test',
      password: 'test',
      owner: testUserData.createdAuthSession.user._id as Types.ObjectId
    };

    const [encryptedUrl, encryptedUsername, encryptedPassword] = await Promise.all([
      encryptAES(passwordData.url as string, testAESKey),
      encryptAES(passwordData.username, testAESKey),
      encryptAES(passwordData.password, testAESKey)
    ]);

    const addPasswordData: AddPasswordMutationVariables = {
      addPasswordArgs: {
        url: {encryptedData: encryptedUrl.encryptedData, iv: encryptedUrl.iv},
        // @ts-expect-error - we are testing bad inputWS
        name: undefined,
        username: {encryptedData: encryptedUsername.encryptedData, iv: encryptedUsername.iv},
        password: {encryptedData: encryptedPassword.encryptedData, iv: encryptedPassword.iv}
      }
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    await expect(addPassword(undefined, addPasswordData, {session: validSession})).rejects.toThrow(
      'Missing required fields'
    );
  });

  it('should throw an error if username is missing', async () => {
    const passwordData: IPassword = {
      url: 'https://www.test.com',
      name: 'test',
      // @ts-expect-error - we are testing bad input
      username: undefined,
      password: 'test',
      owner: testUserData.createdAuthSession.user._id as Types.ObjectId
    };

    const [encryptedUrl, encryptedName, encryptedPassword] = await Promise.all([
      encryptAES(passwordData.url as string, testAESKey),
      encryptAES(passwordData.name, testAESKey),
      encryptAES(passwordData.password, testAESKey)
    ]);

    const addPasswordData: AddPasswordMutationVariables = {
      addPasswordArgs: {
        url: {encryptedData: encryptedUrl.encryptedData, iv: encryptedUrl.iv},
        name: {encryptedData: encryptedName.encryptedData, iv: encryptedName.iv},
        // @ts-expect-error - we are testing bad input
        username: undefined,
        password: {encryptedData: encryptedPassword.encryptedData, iv: encryptedPassword.iv}
      }
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    await expect(addPassword(undefined, addPasswordData, {session: validSession})).rejects.toThrow(
      'Missing required fields'
    );
  });

  it('should throw an error if password is missing', async () => {
    const passwordData: IPassword = {
      url: 'https://www.test.com',
      name: 'test',
      username: 'test',
      // @ts-expect-error - we are testing bad input
      password: undefined,
      owner: testUserData.createdAuthSession.user._id as Types.ObjectId
    };

    const [encryptedUrl, encryptedName, encryptedUsername] = await Promise.all([
      encryptAES(passwordData.url as string, testAESKey),
      encryptAES(passwordData.name, testAESKey),
      encryptAES(passwordData.username, testAESKey)
    ]);

    const addPasswordData: AddPasswordMutationVariables = {
      addPasswordArgs: {
        url: {encryptedData: encryptedUrl.encryptedData, iv: encryptedUrl.iv},
        name: {encryptedData: encryptedName.encryptedData, iv: encryptedName.iv},
        username: {encryptedData: encryptedUsername.encryptedData, iv: encryptedUsername.iv},
        // @ts-expect-error - we are testing bad input
        password: undefined
      }
    };

    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });

    await expect(addPassword(undefined, addPasswordData, {session: validSession})).rejects.toThrow(
      'Missing required fields'
    );
  });

  it('should throw an error if the user is not authenticated', async () => {
    const passwordData: IPassword = {
      url: 'https://www.test.com',
      name: 'test',
      username: 'test',
      password: 'test',
      owner: testUserData.createdAuthSession.user._id as Types.ObjectId
    };

    const [encryptedUrl, encryptedName, encryptedUsername, encryptedPassword] = await Promise.all([
      encryptAES(passwordData.url as string, testAESKey),
      encryptAES(passwordData.name, testAESKey),
      encryptAES(passwordData.username, testAESKey),
      encryptAES(passwordData.password, testAESKey)
    ]);

    const addPasswordData: AddPasswordMutationVariables = {
      addPasswordArgs: {
        url: {encryptedData: encryptedUrl.encryptedData, iv: encryptedUrl.iv},
        name: {encryptedData: encryptedName.encryptedData, iv: encryptedName.iv},
        username: {encryptedData: encryptedUsername.encryptedData, iv: encryptedUsername.iv},
        password: {encryptedData: encryptedPassword.encryptedData, iv: encryptedPassword.iv}
      }
    };

    // remove the session
    await expect(
      // @ts-expect-error - we are testing an unauthenticated user
      addPassword(undefined, addPasswordData, {session: undefined})
    ).rejects.toThrow('Not Authenticated');
  });

  it('should not allow a user to add a password if they have reached the max number of passwords', async () => {
    // set the max number of passwords to 10 from 100 on the FREE account
    await AccountTypeModel.findOneAndUpdate({type: ValidAccountTypes.FREE}, {maxPasswords: 10});
    // create and add the max number of passwords - 1
    const maxPasswords = 10;

    const passwordData: IPassword = {
      url: 'https://www.test.com',
      name: 'test',
      username: 'test',
      password: 'test',
      owner: testUserData.createdAuthSession.user._id as Types.ObjectId
    };
    // @ts-expect-error - we are testing the middleware and don't need to pass in a real request
    const validSession: IAuthSessionDocument = await getAuth({
      headers: {authorization: sessionId, signature}
    });
    let currentNumberOfPasswords: number =
      (
        await UserModel.findById(testUserData.createdAuthSession.user._id).select('passwords')
      )?.toObject().passwords?.length ?? 0;

    for (let i = currentNumberOfPasswords; i < maxPasswords; i++) {
      await Promise.all([
        encryptAES(passwordData.url as string, testAESKey),
        encryptAES(`${passwordData.name}${i}`, testAESKey),
        encryptAES(`${passwordData.username}${i}`, testAESKey),
        encryptAES(`${passwordData.password}${i}`, testAESKey)
      ]).then(async ([encryptedUrl, encryptedName, encryptedUsername, encryptedPassword]) => {
        const addPasswordData: AddPasswordMutationVariables = {
          addPasswordArgs: {
            url: {encryptedData: encryptedUrl.encryptedData, iv: encryptedUrl.iv},
            name: {encryptedData: encryptedName.encryptedData, iv: encryptedName.iv},
            username: {encryptedData: encryptedUsername.encryptedData, iv: encryptedUsername.iv},
            password: {encryptedData: encryptedPassword.encryptedData, iv: encryptedPassword.iv}
          }
        };

        await addPassword(undefined, addPasswordData, {session: validSession});
        currentNumberOfPasswords++;
      });
    }

    // add the last password - should fail
    const [encryptedUrl, encryptedName, encryptedUsername, encryptedPassword] = await Promise.all([
      encryptAES(passwordData.url as string, testAESKey),
      encryptAES(`${passwordData.name}${maxPasswords}`, testAESKey),
      encryptAES(`${passwordData.username}${maxPasswords}`, testAESKey),
      encryptAES(`${passwordData.password}${maxPasswords}`, testAESKey)
    ]);

    const addPasswordData: AddPasswordMutationVariables = {
      addPasswordArgs: {
        url: {encryptedData: encryptedUrl.encryptedData, iv: encryptedUrl.iv},
        name: {encryptedData: encryptedName.encryptedData, iv: encryptedName.iv},
        username: {encryptedData: encryptedUsername.encryptedData, iv: encryptedUsername.iv},
        password: {encryptedData: encryptedPassword.encryptedData, iv: encryptedPassword.iv}
      }
    };

    await expect(addPassword(undefined, addPasswordData, {session: validSession})).rejects.toThrow(
      'Max number of passwords reached'
    );

    // set the max number of passwords back to the default
    await AccountTypeModel.findOneAndUpdate(
      {type: ValidAccountTypes.FREE},
      {maxPasswords: AccountTypeMap[ValidAccountTypes.FREE].maxPasswords}
    );
  }, 30000);
});
