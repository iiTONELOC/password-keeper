import {
  UserRoles,
  IAccountTypeMap,
  ValidAccountTypes,
  AccountStatusTypes
} from 'passwordkeeper.types';

export const DefaultAccountTypes: ValidAccountTypes[] = [
  ValidAccountTypes.FREE,
  ValidAccountTypes.PRO,
  ValidAccountTypes.BUSINESS,
  ValidAccountTypes.TIERED_BUSINESS_1,
  ValidAccountTypes.TIERED_BUSINESS_2,
  ValidAccountTypes.TIERED_BUSINESS_3
];

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

export const DefaultUserRoles: UserRoles[] = [UserRoles.ACCOUNT_OWNER, UserRoles.SUB_USER];
export const DefaultAccountStatusTypes: AccountStatusTypes[] = [
  AccountStatusTypes.ACTIVE,
  AccountStatusTypes.PENDING,
  AccountStatusTypes.CANCELLED,
  AccountStatusTypes.SUSPENDED,
  AccountStatusTypes.DELINQUENT
];

Object.freeze(AccountTypeMap);
Object.freeze(DefaultUserRoles);
Object.freeze(DefaultAccountTypes);
Object.freeze(DefaultAccountStatusTypes);
