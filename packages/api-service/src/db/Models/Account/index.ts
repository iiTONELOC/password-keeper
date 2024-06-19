import {Schema, model} from 'mongoose';
import {DefaultAccountStatusTypes} from '../account-details';
import {AccountStatusTypes, IAccount, IAccountModel} from 'passwordkeeper.types';

const AccountSchema = new Schema<IAccount>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: [...DefaultAccountStatusTypes],
      required: true,
      default: AccountStatusTypes.PENDING
    },
    subUsers: {
      type: [Schema.Types.ObjectId],
      ref: 'User'
    },
    passwords: {
      type: [Schema.Types.ObjectId],
      ref: 'EncryptedUserPassword'
    },
    publicKeys: {
      type: [Schema.Types.ObjectId],
      ref: 'PublicKey'
    },
    accountType: {
      type: Schema.Types.ObjectId,
      ref: 'AccountType',
      required: true
    }
  },
  {
    id: false,
    timestamps: true,
    toJSON: {
      virtuals: true
    }
  }
);

AccountSchema.virtual('userCount').get(function () {
  return this.subUsers.length + 1;
});

AccountSchema.virtual('passwordCount').get(function () {
  return this.passwords.length;
});

AccountSchema.virtual('publicKeyCount').get(function () {
  return this.publicKeys.length;
});

const AccountModel: IAccountModel = model<IAccount>('Account', AccountSchema);

export default AccountModel;
