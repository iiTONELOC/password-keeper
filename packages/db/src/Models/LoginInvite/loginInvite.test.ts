import {ILoginInviteModel} from 'passwordkeeper.types';
import LoginInviteModel from './index';
import {describe, expect, it} from '@jest/globals';

describe('LoginInvite Model', () => {
  it('Should be a function', () => {
    expect(LoginInviteModel).toBeInstanceOf(Function);
  });

  it('Should return a model object', () => {
    const LoginInvite: ILoginInviteModel = LoginInviteModel;
    expect(LoginInvite).toHaveProperty('schema');
    expect(LoginInvite).toHaveProperty('model');
    expect(LoginInvite).toHaveProperty('modelName');
    expect(LoginInvite.modelName).toEqual('LoginInvite');
  });

  it('Should have a schema with 9 total properties', () => {
    const schemaPaths = Object.keys(LoginInviteModel.schema.paths);

    expect(schemaPaths).toHaveLength(8);
    expect(schemaPaths).toContain('_id');
    expect(schemaPaths).toContain('nonce');
    expect(schemaPaths).toContain('user');
    expect(schemaPaths).toContain('challenge');
    expect(schemaPaths).toContain('expiresAt');
    expect(schemaPaths).toContain('createdAt');
    expect(schemaPaths).toContain('updatedAt');
    expect(schemaPaths).toContain('__v');
  });
});
