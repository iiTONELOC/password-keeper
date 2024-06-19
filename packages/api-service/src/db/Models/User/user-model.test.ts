import UserModel from './';
import {describe, expect, it} from '@jest/globals';
import type {IUserModel} from 'passwordkeeper.types';

describe('User Model', () => {
  it('Should be a function', () => {
    expect(UserModel).toBeInstanceOf(Function);
  });

  it('Should return a model object', () => {
    const User: IUserModel = UserModel;
    expect(User).toHaveProperty('schema');
    expect(User).toHaveProperty('model');
    expect(User).toHaveProperty('modelName');
    expect(User.modelName).toEqual('User');
  });

  it('Should have a schema with 11 total properties', () => {
    const User: IUserModel = UserModel;
    const schemaPaths = Object.keys(User.schema.paths);

    expect(schemaPaths).toHaveLength(11);

    const expectedPaths = [
      'username',
      'email',
      'publicKeys',
      'account',
      'subUsers',
      'passwords',
      '_id',
      'userRole',
      'createdAt',
      'updatedAt',
      '__v'
    ];

    expect(schemaPaths).toEqual(expect.arrayContaining(expectedPaths));
  });
});
