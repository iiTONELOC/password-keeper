import AccountType from './index';
import {describe, expect, it} from '@jest/globals';
import {AccountTypeMap, DefaultAccountTypes} from './account-details';
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
    expect(schemaPaths).toContain('maxPublicKeys');
    expect(schemaPaths).toContain('maxPasswords');
  });
});

describe('Default Account Types', () => {
  it('Should be an array', () => {
    expect(DefaultAccountTypes).toBeInstanceOf(Array);
  });

  it('Should have 6 elements', () => {
    expect(DefaultAccountTypes).toHaveLength(6);
  });

  it('Should contain all valid account types', () => {
    expect(DefaultAccountTypes).toContain(ValidAccountTypes.FREE);
    expect(DefaultAccountTypes).toContain(ValidAccountTypes.PRO);
    expect(DefaultAccountTypes).toContain(ValidAccountTypes.BUSINESS);
    expect(DefaultAccountTypes).toContain(ValidAccountTypes.TIERED_BUSINESS_1);
    expect(DefaultAccountTypes).toContain(ValidAccountTypes.TIERED_BUSINESS_2);
    expect(DefaultAccountTypes).toContain(ValidAccountTypes.TIERED_BUSINESS_3);
  });

  it('Should be frozen', () => {
    expect(Object.isFrozen(DefaultAccountTypes)).toBeTruthy();
  });

  it('Should not be able to be modified', () => {
    const fn = () => {
      DefaultAccountTypes.push(ValidAccountTypes.FREE);
    };
    expect(fn).toThrowError();
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
      maxUsers: 1,
      maxPublicKeys: 3,
      maxPasswords: 100
    });
    expect(AccountTypeMap.PRO).toEqual({
      type: ValidAccountTypes.PRO,
      price: 5,
      maxUsers: 3,
      maxPublicKeys: 9,
      maxPasswords: 500
    });
    expect(AccountTypeMap.BUSINESS).toEqual({
      type: ValidAccountTypes.BUSINESS,
      price: 10,
      maxUsers: 10,
      maxPublicKeys: 30,
      maxPasswords: 2000
    });
    expect(AccountTypeMap.TIERED_BUSINESS_1).toEqual({
      type: ValidAccountTypes.TIERED_BUSINESS_1,
      price: 25,
      maxUsers: 25,
      maxPublicKeys: 75,
      maxPasswords: 5000
    });
    expect(AccountTypeMap.TIERED_BUSINESS_2).toEqual({
      type: ValidAccountTypes.TIERED_BUSINESS_2,
      price: 50,
      maxUsers: 50,
      maxPublicKeys: 150,
      maxPasswords: 10000
    });
    expect(AccountTypeMap.TIERED_BUSINESS_3).toEqual({
      type: ValidAccountTypes.TIERED_BUSINESS_3,
      price: 100,
      maxUsers: -1,
      maxPublicKeys: -1,
      maxPasswords: -1
    });
  });

  it('Should be frozen', () => {
    expect(Object.isFrozen(AccountTypeMap)).toBeTruthy();
  });

  it('Should not be able to be modified', () => {
    const fn = () => {
      AccountTypeMap.FREE = {
        type: ValidAccountTypes.FREE,
        price: 0,
        maxUsers: 2,
        maxPublicKeys: 3,
        maxPasswords: 100
      };
    };
    expect(fn).toThrowError();
  });
});
