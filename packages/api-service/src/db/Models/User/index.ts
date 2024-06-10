import {Schema, model} from 'mongoose';
import type {IUser, IUserModel} from 'passwordkeeper.types';

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
    publicKeys: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PublicKey',
        required: false,
        default: []
      }
    ]
  },
  {id: false, timestamps: true}
);

const User: IUserModel = model<IUser>('User', UserSchema);

export default User;
