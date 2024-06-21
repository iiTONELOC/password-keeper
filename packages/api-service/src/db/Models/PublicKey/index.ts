import {Schema, model} from 'mongoose';
import type {IPublicKey, IPublicKeyDocument, IPublicKeyModel} from 'passwordkeeper.types';

const get30DaysFromNow = () => new Date(Date.now() + 2592000000);

// allows alphanumeric characters, spaces, dashes, underscores, and periods
const allowedCharsRegex = /^[a-zA-Z0-9 _\-.]+$/;
// PEM format public key regex as written to a file
export const publicKeyRegex =
  /-----BEGIN PUBLIC KEY-----\s*([A-Za-z0-9+/=\r\n]+)\s*-----END PUBLIC KEY-----/;

const PublicKeySchema = new Schema<IPublicKey>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      validate: {
        validator: function (key: string) {
          return publicKeyRegex.test(key);
        },
        message: 'Key must be a valid public key in PEM format.'
      }
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      required: false,
      default: get30DaysFromNow,
      validate: {
        validator: function (expiresAt: Date) {
          return expiresAt > new Date();
        },
        message: 'Expiration date must be in the future!'
      }
    },
    default: {
      type: Boolean,
      required: true,
      default: false
    },
    label: {
      type: String,
      required: false,
      trim: true,
      minlength: 1,
      maxlength: 100,
      validate: [
        {
          validator: function (label: string) {
            return allowedCharsRegex.test(label);
          },
          message:
            'Label must contain only alphanumeric characters, spaces, dashes, underscores, or periods.'
        },
        {
          validator: async function (label: string) {
            const document = this as IPublicKeyDocument;
            // Skip validation if label is empty (not required)
            if (!label) return true;

            const count = await model('PublicKey').countDocuments({
              owner: document.owner,
              label: label,
              _id: {$ne: document._id} // Exclude current document from uniqueness check
            });

            return count === 0;
          },
          message: 'Label must be unique for the user.'
        }
      ]
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
      validate: {
        validator: function (description: string) {
          return allowedCharsRegex.test(description);
        },
        message:
          'Description must contain only alphanumeric characters, spaces, dashes, underscores, or periods.'
      }
    }
  },
  {
    id: false,
    timestamps: true
  }
);

const PublicKey: IPublicKeyModel = model<IPublicKey>('PublicKey', PublicKeySchema);

export default PublicKey;
