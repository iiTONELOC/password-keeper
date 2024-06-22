import AccountModel from '.';
import {describe, expect, it} from '@jest/globals';
import {IAccountModel, AccountStatusTypes, IAccountDocument} from 'passwordkeeper.types';

describe('Account Model', () => {
  it('Should be a function', () => {
    expect(AccountModel).toBeInstanceOf(Function);
  });

  it('Should return a model object', () => {
    const Account: IAccountModel = AccountModel;
    expect(Account).toHaveProperty('schema');
    expect(Account).toHaveProperty('model');
    expect(Account).toHaveProperty('modelName');
    expect(Account.modelName).toEqual('Account');
  });

  it('Should have a schema with 10 total properties', () => {
    const Account: IAccountModel = AccountModel;
    const schemaPaths = Object.keys(Account.schema.paths);

    expect(schemaPaths).toHaveLength(11);
    expect(schemaPaths).toContain('_id');
    expect(schemaPaths).toContain('owner');
    expect(schemaPaths).toContain('status');
    expect(schemaPaths).toContain('subUsers');
    expect(schemaPaths).toContain('passwords');
    expect(schemaPaths).toContain('deletedAt');
    expect(schemaPaths).toContain('publicKeys');
    expect(schemaPaths).toContain('accountType');
  });

  it('Should have a default status of PENDING', () => {
    const Account: IAccountModel = AccountModel;
    const account = new Account({
      owner: '60e1f1e5b9e4f2b7c8e4d3d2',
      accountType: '60e1f1e5b9e4f2b7c8e4d3d2'
    }).toObject() as IAccountDocument;

    expect(account.status).toEqual(AccountStatusTypes.PENDING);
  });
});
