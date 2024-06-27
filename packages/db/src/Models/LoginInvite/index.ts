import {Schema, model} from 'mongoose';
import {EncryptedDataSchema} from '../Schemas/EncryptedDataSchema';
import type {ILoginInvite, ILoginInviteModel} from 'passwordkeeper.types';

// Define the LoginInvite Schema
const LoginInviteSchema = new Schema<ILoginInvite>(
  {
    nonce: {
      type: EncryptedDataSchema,
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    challenge: {
      type: EncryptedDataSchema,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      // provide a default value of 15 minutes from now
      default: () => new Date(new Date().getTime() + 15 * 60 * 1000),
      // validate the expiresAt date is in the future but is less than 30 minutes from now
      validate: {
        validator: function (value: Date) {
          return value > new Date() && value < new Date(new Date().getTime() + 30 * 60 * 1000);
        },
        message: 'expiresAt must be in the future but less than 30 minutes from now'
      }
    }
  },
  {id: false, timestamps: true}
);

const LoginInvite: ILoginInviteModel = model<ILoginInvite>('LoginInvite', LoginInviteSchema);

export default LoginInvite;
