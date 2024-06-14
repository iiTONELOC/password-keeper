import AccountType from './index';
import {AccountTypeMap} from './account-details';
import {describe, expect, it} from '@jest/globals';
import {IAccountTypeModel, ValidAccountTypes} from 'passwordkeeper.types';

describe('AccountType Model', () => {
  it('Should be a function', () => {
    expect(AccountType).toBeInstanceOf(Function);
  });

  it('Should return a model object', () => {
    const AccountTypeModel: IAccountTypeModel = AccountType;
    expect(AccountTypeModel).toHaveProperty('schema');
    expect(AccountTypeModel).toHaveProperty('model');
    expect(AccountTypeModel).toHaveProperty('modelName');
    expect(AccountTypeModel.modelName).toEqual('AccountType');
  });

  it('Should have a schema with 6 total properties', () => {
    const AccountTypeModel: IAccountTypeModel = AccountType;
    const schemaPaths = Object.keys(AccountTypeModel.schema.paths);

    expect(schemaPaths).toHaveLength(6);
    expect(schemaPaths).toContain('_id');
    expect(schemaPaths).toContain('__v');
    expect(schemaPaths).toContain('type');
    expect(schemaPaths).toContain('price');
    expect(schemaPaths).toContain('maxUsers');
    expect(schemaPaths).toContain('maxPasswords');
  });
});

describe('ValidAccountTypes', () => {
  it('Should be an object', () => {
    expect(ValidAccountTypes).toBeInstanceOf(Object);
  });

  it('Should have 6 properties', () => {
    const keys = Object.keys(ValidAccountTypes);
    expect(keys).toHaveLength(6);
    expect(keys).toContain('FREE');
    expect(keys).toContain('PRO');
    expect(keys).toContain('BUSINESS');
    expect(keys).toContain('TIERED_BUSINESS_1');
    expect(keys).toContain('TIERED_BUSINESS_2');
    expect(keys).toContain('TIERED_BUSINESS_3');
  });
});

describe('AccountTypeMap', () => {
  it('Should be an object', () => {
    expect(AccountTypeMap).toBeInstanceOf(Object);
  });

  it('Should have 6 properties', () => {
    const keys = Object.keys(AccountTypeMap);
    expect(keys).toHaveLength(6);
    expect(keys).toContain('FREE');
    expect(keys).toContain('PRO');
    expect(keys).toContain('BUSINESS');
    expect(keys).toContain('TIERED_BUSINESS_1');
    expect(keys).toContain('TIERED_BUSINESS_2');
    expect(keys).toContain('TIERED_BUSINESS_3');
  });

  it('should have the correct values for each account type', () => {
    expect(AccountTypeMap.FREE).toEqual({
      type: ValidAccountTypes.FREE,
      price: 0,
      maxUsers: 3,
      maxPasswords: 100
    });
    expect(AccountTypeMap.PRO).toEqual({
      type: ValidAccountTypes.PRO,
      price: 5,
      maxUsers: 10,
      maxPasswords: 500
    });
    expect(AccountTypeMap.BUSINESS).toEqual({
      type: ValidAccountTypes.BUSINESS,
      price: 10,
      maxUsers: 25,
      maxPasswords: 1000
    });
    expect(AccountTypeMap.TIERED_BUSINESS_1).toEqual({
      type: ValidAccountTypes.TIERED_BUSINESS_1,
      price: 25,
      maxUsers: 50,
      maxPasswords: 2000
    });
    expect(AccountTypeMap.TIERED_BUSINESS_2).toEqual({
      type: ValidAccountTypes.TIERED_BUSINESS_2,
      price: 50,
      maxUsers: 100,
      maxPasswords: 5000
    });
    expect(AccountTypeMap.TIERED_BUSINESS_3).toEqual({
      type: ValidAccountTypes.TIERED_BUSINESS_3,
      price: 100,
      maxUsers: -1,
      maxPasswords: -1
    });
  });
});
