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
    maxUsers: 3,
    maxPasswords: 100
  },
  [ValidAccountTypes.PRO]: {
    type: ValidAccountTypes.PRO,
    price: 5,
    maxUsers: 10,
    maxPasswords: 500
  },
  [ValidAccountTypes.BUSINESS]: {
    type: ValidAccountTypes.BUSINESS,
    price: 10,
    maxUsers: 25,
    maxPasswords: 1000
  },
  [ValidAccountTypes.TIERED_BUSINESS_1]: {
    type: ValidAccountTypes.TIERED_BUSINESS_1,
    price: 25,
    maxUsers: 50,
    maxPasswords: 2000
  },
  [ValidAccountTypes.TIERED_BUSINESS_2]: {
    type: ValidAccountTypes.TIERED_BUSINESS_2,
    price: 50,
    maxUsers: 100,
    maxPasswords: 5000
  },
  [ValidAccountTypes.TIERED_BUSINESS_3]: {
    type: ValidAccountTypes.TIERED_BUSINESS_3,
    price: 100,
    maxUsers: -1,
    maxPasswords: -1
  }
};

// freeze the map so it cannot be modified
Object.freeze(AccountTypeMap);

// hash the accountTypes and the map so we can know if they have changed
const typeAndMapString = JSON.stringify(DefaultAccountTypes) + JSON.stringify(AccountTypeMap);
export const accountTypeHash = require('crypto')
  .createHash('sha256')
  .update(typeAndMapString)
  .digest('hex')
  .toString();

// freeze the hash so it cannot be modified
Object.freeze(accountTypeHash);
