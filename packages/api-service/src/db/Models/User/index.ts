import {Schema, model} from 'mongoose';
import {DefaultUserRoles} from '../account-details';
import {IUser, IUserModel, UserRoles} from 'passwordkeeper.types';

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
    ],
    account: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: false,
      default: undefined
    },
    userRole: {
      type: String,
      required: true,
      enum: [...DefaultUserRoles],
      default: UserRoles.ACCOUNT_OWNER
    },
    // TODO: Create a SubUser Model to replace the subUsers field
    subUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: []
      }
    ],
    passwords: [
      {
        type: Schema.Types.ObjectId,
        ref: 'EncryptedUserPassword',
        required: false,
        default: []
      }
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    }
  },
  {id: false, timestamps: true, toJSON: {virtuals: true}}
);

const User: IUserModel = model<IUser>('User', UserSchema);

// create a virtual property to get the total number of user passwords
UserSchema.virtual('passwordCount').get(function (this: IUser) {
  return this?.passwords?.length ?? 0;
});

export default User;
