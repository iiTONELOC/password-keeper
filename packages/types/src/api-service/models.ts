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

// _______ Account Completion Invites _______

export type IAccountCompletionInvite = {
  nonce: string;
  user: string | Types.ObjectId;
  expiresAt: Date;
};

export type IAccountCompletionInviteModel = Model<IAccountCompletionInvite>;
export type IAccountCompletionInviteDocument = HydratedDocument<
  IAccountCompletionInvite,
  Timestamps
>;

//  _______ Public Keys _______

export type IPublicKey = {
  key: string;
  owner: string | Types.ObjectId;
  expiresAt?: Date;
};

export type IPublicKeyModel = Model<IPublicKey>;
export type IPublicKeyDocument = HydratedDocument<IPublicKey, Timestamps>;

// _________ Auth Sessions _______

export type IAuthSession = {
  nonce: string;
  user: string | Types.ObjectId;
  expiresAt: Date;
  valid?: boolean;
};

export type IAuthSessionModel = Model<IAuthSession>;
export type IAuthSessionDocument = HydratedDocument<IAuthSession, Timestamps>;
