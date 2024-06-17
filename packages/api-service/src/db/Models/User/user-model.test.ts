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

  it('Should have a schema with 7 total properties', () => {
    const User: IUserModel = UserModel;
    const schemaPaths = Object.keys(User.schema.paths);

    expect(schemaPaths).toHaveLength(9);

    expect(schemaPaths).toContain('_id');
    expect(schemaPaths).toContain('__v');
    expect(schemaPaths).toContain('email');
    expect(schemaPaths).toContain('username');
    expect(schemaPaths).toContain('subUsers');
    expect(schemaPaths).toContain('createdAt');
    expect(schemaPaths).toContain('updatedAt');
    expect(schemaPaths).toContain('publicKeys');
    expect(schemaPaths).toContain('accountType');
  });
});
