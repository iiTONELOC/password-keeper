import {Schema, model} from 'mongoose';
import type {IAccountCompletionInvite, IAccountCompletionInviteModel} from 'passwordkeeper.types';

// Define the AccountCompletionInvite Schema
const AccountCompletionInviteSchema = new Schema<IAccountCompletionInvite>(
  {
    nonce: {
      type: String,
      required: true,
      unique: true,
      // validate the nonce is a 64 character hex string
      validate: {
        validator: function (value: string) {
          return /^[0-9a-f]{64}$/.test(value);
        },
        message: 'nonce must be a 64 character hex string'
      }
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      // provide a default value of 24 hours from now
      default: () => new Date(new Date().getTime() + 24 * 60 * 60 * 1000),

      validate: {
        // ensure the expiresAt date is in the future but is less than 48 hours from now
        validator: function (value: Date) {
          return value > new Date() && value < new Date(new Date().getTime() + 48 * 60 * 60 * 1000);
        },
        message: 'expiresAt must be in the future but less than 48 hours from now'
      }
    }
  },
  {id: false, timestamps: true}
);

const AccountCompletionInviteModel: IAccountCompletionInviteModel = model<IAccountCompletionInvite>(
  'AccountCompletionInvite',
  AccountCompletionInviteSchema
);

export default AccountCompletionInviteModel;
