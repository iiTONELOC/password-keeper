import {Model, Types} from 'mongoose';

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
export type IUserDocument = IUserModel &
  IUser &
  Timestamps & {
    _id: Types.ObjectId;
    publicKeys: IPublicKeyDocument[];
  };

// _______ Account Completion Invites _______

export type IAccountCompletionInvite = {
  nonce: string;
  user: string | Types.ObjectId;
  expiresAt: Date;
};

export type IAccountCompletionInviteModel = Model<IAccountCompletionInvite>;
export type IAccountCompletionInviteDocument = IAccountCompletionInviteModel &
  IAccountCompletionInvite &
  Timestamps & {
    _id: Types.ObjectId;
    user: IUserDocument;
  };

//  _______ Public Keys _______

export type IPublicKey = {
  key: string;
  owner: string | Types.ObjectId;
  expiresAt?: Date;
};

export type IPublicKeyModel = Model<IPublicKey>;
export type IPublicKeyDocument = IPublicKeyModel &
  IPublicKey &
  Timestamps & {
    _id: Types.ObjectId;
    owner: IUserDocument;
  };

// _________ Auth Sessions _______

export type IAuthSession = {
  nonce: string;
  user: string | Types.ObjectId;
  expiresAt: Date;
  iv?: string;
};

export type IAuthSessionModel = Model<IAuthSession>;
export type IAuthSessionDocument = IAuthSessionModel &
  IAuthSession &
  Timestamps & {
    _id: Types.ObjectId;
    user: IUserDocument;
  };
