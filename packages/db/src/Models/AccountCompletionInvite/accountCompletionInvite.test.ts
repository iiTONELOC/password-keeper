import AccountCompletionInviteModel from '.';
import {describe, expect, it} from '@jest/globals';
import type {IAccountCompletionInviteModel} from 'passwordkeeper.types';

describe('AccountCompletionInvite Model', () => {
  it('Should be a function', () => {
    expect(AccountCompletionInviteModel).toBeInstanceOf(Function);
  });

  it('Should return a model object', () => {
    const AccountCompletionInvite: IAccountCompletionInviteModel = AccountCompletionInviteModel;
    expect(AccountCompletionInvite).toHaveProperty('schema');
    expect(AccountCompletionInvite).toHaveProperty('model');
    expect(AccountCompletionInvite).toHaveProperty('modelName');
    expect(AccountCompletionInvite.modelName).toEqual('AccountCompletionInvite');
  });

  it('Should have a schema with 6 total properties', () => {
    const AccountCompletionInvite: IAccountCompletionInviteModel = AccountCompletionInviteModel;
    const schemaPaths = Object.keys(AccountCompletionInvite.schema.paths);

    expect(schemaPaths).toHaveLength(7);
    expect(schemaPaths).toContain('_id');
    expect(schemaPaths).toContain('__v');
    expect(schemaPaths).toContain('user');
    expect(schemaPaths).toContain('nonce');
    expect(schemaPaths).toContain('expiresAt');
    expect(schemaPaths).toContain('createdAt');
    expect(schemaPaths).toContain('updatedAt');
  });
});
