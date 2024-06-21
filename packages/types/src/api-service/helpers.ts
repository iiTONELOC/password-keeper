/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {Types} from 'mongoose';
import {IUserDocument} from './models';

export type AddPublicKeyProps = {
  userId: Types.ObjectId;
  publicKey: string;
  label?: string;
  description?: string;
  expiresAt?: Date;
  defaultKey?: boolean;
};

export type AddPublicKeyReturns = {user: IUserDocument; addedKeyId: Types.ObjectId};
