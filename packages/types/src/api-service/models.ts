import {HydratedDocument, Model} from 'mongoose';

export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type IUser = {
  username: string;
  email: string;
  publicKeys?: string[];
};

export type IUserModel = Model<IUser>;
export type IUserDocument = HydratedDocument<IUser, Timestamps>;
