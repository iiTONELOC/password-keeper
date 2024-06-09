import {HydratedDocument, Model, Types} from 'mongoose';

export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};

//  _______ Users _______

export type IUser = {
  username: string;
  email: string;
  publicKeys?: Types.ObjectId[];
};

export type IUserModel = Model<IUser>;
export type IUserDocument = HydratedDocument<IUser, Timestamps>;

//  _______ Public Keys _______

export type IPublicKey = {
  key: string;
  owner: string | Types.ObjectId;
  expiresAt?: Date;
};

export type IPublicKeyModel = Model<IPublicKey>;
export type IPublicKeyDocument = HydratedDocument<IPublicKey, Timestamps>;
