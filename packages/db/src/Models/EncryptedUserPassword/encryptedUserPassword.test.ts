import UserPasswordModel from './';
import {describe, expect, it} from '@jest/globals';
import type {IUserPasswordModel} from 'passwordkeeper.types';

describe('UserPassword Model', () => {
  it('Should be a function', () => {
    expect(UserPasswordModel).toBeInstanceOf(Function);
  });

  it('Should return a model object', () => {
    const UserPassword: IUserPasswordModel = UserPasswordModel;
    expect(UserPassword).toHaveProperty('schema');
    expect(UserPassword).toHaveProperty('model');
    expect(UserPassword).toHaveProperty('modelName');
    expect(UserPassword.modelName).toEqual('EncryptedUserPassword');
  });

  it('Should have a schema with 8 total properties', () => {
    const UserPassword: IUserPasswordModel = UserPasswordModel;
    const schemaPaths = Object.keys(UserPassword.schema.paths);

    const expectedPaths = [
      'name.encryptedData',
      'username.encryptedData',
      'password.encryptedData',
      'url.encryptedData',
      'owner',
      'expiresAt',
      '_id',
      '__v'
    ];

    expect(schemaPaths).toHaveLength(8);
    expect(schemaPaths).toEqual(expect.arrayContaining(expectedPaths));
  });
});
