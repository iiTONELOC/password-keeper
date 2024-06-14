import {IAccountTypeMap, ValidAccountTypes} from 'passwordkeeper.types';

export const DefaultAccountTypes: ValidAccountTypes[] = [
  ValidAccountTypes.FREE,
  ValidAccountTypes.PRO,
  ValidAccountTypes.BUSINESS,
  ValidAccountTypes.TIERED_BUSINESS_1,
  ValidAccountTypes.TIERED_BUSINESS_2,
  ValidAccountTypes.TIERED_BUSINESS_3
];
// freeze the array so it cannot be modified
Object.freeze(DefaultAccountTypes);

export const AccountTypeMap: IAccountTypeMap = {
  [ValidAccountTypes.FREE]: {
    type: ValidAccountTypes.FREE,
    price: 0,
    maxDevices: 3,
    maxPasswords: 100
  },
  [ValidAccountTypes.PRO]: {
    type: ValidAccountTypes.PRO,
    price: 5,
    maxDevices: 10,
    maxPasswords: 500
  },
  [ValidAccountTypes.BUSINESS]: {
    type: ValidAccountTypes.BUSINESS,
    price: 10,
    maxDevices: 25,
    maxPasswords: 1000
  },
  [ValidAccountTypes.TIERED_BUSINESS_1]: {
    type: ValidAccountTypes.TIERED_BUSINESS_1,
    price: 25,
    maxDevices: 50,
    maxPasswords: 2000
  },
  [ValidAccountTypes.TIERED_BUSINESS_2]: {
    type: ValidAccountTypes.TIERED_BUSINESS_2,
    price: 50,
    maxDevices: 100,
    maxPasswords: 5000
  },
  [ValidAccountTypes.TIERED_BUSINESS_3]: {
    type: ValidAccountTypes.TIERED_BUSINESS_3,
    price: 100,
    maxDevices: -1,
    maxPasswords: -1
  }
};

// freeze the map so it cannot be modified
Object.freeze(AccountTypeMap);
