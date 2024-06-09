import {Schema, model, Types} from 'mongoose';
import {IUser, IUserModel} from '../../../../../types/src';

// Define the User Schema
const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 75,
      validate: {
        validator: function (username: string) {
          return /^[a-zA-Z0-9]+$/.test(username);
        },
        message: 'Username must only contain letters and numbers!'
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/.+@.+\..+/, 'Please enter a valid e-mail address!']
    },
    publicKeys: {
      type: [{type: Types.ObjectId, ref: 'PublicKey'}],
      default: []
    }
  },
  {id: false, timestamps: true}
);

const User: IUserModel = model<IUser>('User', UserSchema);

export default User;
