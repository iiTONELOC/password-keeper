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

  it('Should have a schema with 12 total properties', () => {
    const UserPassword: IUserPasswordModel = UserPasswordModel;
    const schemaPaths = Object.keys(UserPassword.schema.paths);

    const expectedPaths = [
      'name.encryptedData',
      'name.iv',
      'username.encryptedData',
      'username.iv',
      'password.encryptedData',
      'password.iv',
      'url.encryptedData',
      'url.iv',
      'owner',
      'expiresAt',
      '_id',
      '__v'
    ];

    expect(schemaPaths).toHaveLength(12);
    expect(schemaPaths).toEqual(expect.arrayContaining(expectedPaths));
  });
});
