import {Schema, model} from 'mongoose';
import {DefaultAccountTypes, AccountTypeMap} from './account-details';
import {IAccountType, IAccountTypeModel, ValidAccountTypes} from 'passwordkeeper.types';

// Define the AccountType Schema
const AccountTypeSchema = new Schema<IAccountType>(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      enum: [...DefaultAccountTypes],
      default: ValidAccountTypes.FREE
    },
    price: {
      type: Number,
      required: true,
      default: AccountTypeMap[ValidAccountTypes.FREE].price
    },
    maxPublicKeys: {
      type: Number,
      required: true,
      default: AccountTypeMap[ValidAccountTypes.FREE].maxPublicKeys
    },
    maxPasswords: {
      type: Number,
      required: true,
      default: AccountTypeMap[ValidAccountTypes.FREE].maxPasswords
    }
  },
  {id: false, timestamps: false}
);

const AccountType: IAccountTypeModel = model<IAccountType>('AccountType', AccountTypeSchema);

export default AccountType;

export {DefaultAccountTypes, AccountTypeMap};
