import PublicKeyModel from './index';
import {describe, expect, it} from '@jest/globals';
import type {IPublicKeyModel} from 'passwordkeeper.types';

describe('PublicKey Model', () => {
  it('Should be a function', () => {
    expect(PublicKeyModel).toBeInstanceOf(Function);
  });

  it('Should return a model object', () => {
    const PublicKey: IPublicKeyModel = PublicKeyModel;
    expect(PublicKey).toHaveProperty('schema');
    expect(PublicKey).toHaveProperty('model');
    expect(PublicKey).toHaveProperty('modelName');
    expect(PublicKey.modelName).toEqual('PublicKey');
  });

  it('Should have a schema with 7 total properties', () => {
    const PublicKey: IPublicKeyModel = PublicKeyModel;
    const schemaPaths = Object.keys(PublicKey.schema.paths);

    expect(schemaPaths).toHaveLength(7);
    expect(schemaPaths).toContain('_id');
    expect(schemaPaths).toContain('key');
    expect(schemaPaths).toContain('owner');
    expect(schemaPaths).toContain('createdAt');
    expect(schemaPaths).toContain('updatedAt');
    expect(schemaPaths).toContain('expiresAt');
    expect(schemaPaths).toContain('__v');
  });
});
