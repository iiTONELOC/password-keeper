import {Schema, model} from 'mongoose';
import {IPublicKey, IPublicKeyModel} from 'passwordkeeper.types';

const get30DaysFromNow = () => new Date(Date.now() + 2592000000); // 30 days from now

const PublicKeySchema = new Schema<IPublicKey>(
  {
    key: {
      type: String,
      required: true,
      trim: true
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
    }
  },
  {
    id: false,
    timestamps: true
  }
);

const PublicKey: IPublicKeyModel = model<IPublicKey>('PublicKey', PublicKeySchema);

export default PublicKey;
