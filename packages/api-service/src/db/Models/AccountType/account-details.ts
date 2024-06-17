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
    maxUsers: 1,
    maxPublicKeys: 3,
    maxPasswords: 100
  },
  [ValidAccountTypes.PRO]: {
    type: ValidAccountTypes.PRO,
    price: 5,
    maxUsers: 3,
    maxPublicKeys: 9,
    maxPasswords: 500
  },
  [ValidAccountTypes.BUSINESS]: {
    type: ValidAccountTypes.BUSINESS,
    price: 10,
    maxUsers: 10,
    maxPublicKeys: 30,
    maxPasswords: 2000
  },
  [ValidAccountTypes.TIERED_BUSINESS_1]: {
    type: ValidAccountTypes.TIERED_BUSINESS_1,
    price: 25,
    maxUsers: 25,
    maxPublicKeys: 75,
    maxPasswords: 5000
  },
  [ValidAccountTypes.TIERED_BUSINESS_2]: {
    type: ValidAccountTypes.TIERED_BUSINESS_2,
    price: 50,
    maxUsers: 50,
    maxPublicKeys: 150,
    maxPasswords: 10000
  },
  [ValidAccountTypes.TIERED_BUSINESS_3]: {
    type: ValidAccountTypes.TIERED_BUSINESS_3,
    price: 100,
    maxUsers: -1,
    maxPublicKeys: -1,
    maxPasswords: -1
  }
};

// freeze the map so it cannot be modified
Object.freeze(AccountTypeMap);
