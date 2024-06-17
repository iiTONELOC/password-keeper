import {Schema, model} from 'mongoose';
import EncryptedDataSchema from '../Schemas/EncryptedDataSchema';
import type {IPasswordEncryptedAtRest, IUserPasswordModel} from 'passwordkeeper.types';

// Define the EncryptedData Schema only
const EncryptedUserPasswordSchema = new Schema<IPasswordEncryptedAtRest>(
  {
    name: {
      encryptedData: {
        type: EncryptedDataSchema,
        required: true
      },
      iv: {
        type: String,
        required: true
      },
      required: true
    },
    username: {
      encryptedData: {
        type: EncryptedDataSchema,
        required: true
      },
      iv: {
        type: String,
        required: true
      },
      required: true
    },
    password: {
      encryptedData: {
        type: EncryptedDataSchema,
        required: true
      },
      iv: {
        type: String,
        required: true
      },
      required: true
    },
    url: {
      encryptedData: {
        type: EncryptedDataSchema,
        required: false,
        default: undefined
      },
      iv: {
        type: String,
        required: false,
        default: undefined
      },
      required: false
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      required: false,
      default: undefined
    }
  },
  {id: false, timestamps: false}
);

const EncryptedUserPassword: IUserPasswordModel = model<IPasswordEncryptedAtRest>(
  'EncryptedUserPassword',
  EncryptedUserPasswordSchema
);

export default EncryptedUserPassword;
