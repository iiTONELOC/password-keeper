import {Schema, model} from 'mongoose';
import {IAuthSession, IAuthSessionModel} from 'packages/types/src';

// Define the AuthSession Schema
const AuthSessionSchema = new Schema<IAuthSession>(
  {
    nonce: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    valid: {
      type: Boolean,
      default: true
    }
  },
  {id: false, timestamps: true}
);

const AuthSession: IAuthSessionModel = model<IAuthSession>('AuthSession', AuthSessionSchema);

export default AuthSession;
