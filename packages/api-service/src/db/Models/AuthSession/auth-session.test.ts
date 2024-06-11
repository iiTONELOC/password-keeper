import AuthSessionModel from './index';
import {describe, expect, it} from '@jest/globals';
import type {IAuthSessionModel} from 'passwordkeeper.types';

describe('AuthSession Model', () => {
  it('Should be a function', () => {
    expect(AuthSessionModel).toBeInstanceOf(Function);
  });

  it('Should return a model object', () => {
    const AuthSession: IAuthSessionModel = AuthSessionModel;
    expect(AuthSession).toHaveProperty('schema');
    expect(AuthSession).toHaveProperty('model');
    expect(AuthSession).toHaveProperty('modelName');
    expect(AuthSession.modelName).toEqual('AuthSession');
  });

  it('Should have a schema with 7 total properties', () => {
    const AuthSession: IAuthSessionModel = AuthSessionModel;
    const schemaPaths = Object.keys(AuthSession.schema.paths);

    expect(schemaPaths).toHaveLength(8);
    expect(schemaPaths).toContain('_id');
    expect(schemaPaths).toContain('nonce');
    expect(schemaPaths).toContain('user');
    expect(schemaPaths).toContain('iv');
    expect(schemaPaths).toContain('expiresAt');
    expect(schemaPaths).toContain('createdAt');
    expect(schemaPaths).toContain('updatedAt');
    expect(schemaPaths).toContain('__v');
  });
});
