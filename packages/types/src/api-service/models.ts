import {Model, Types} from 'mongoose';

export enum ValidAccountTypes {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  TIERED_BUSINESS_1 = 'TIERED_BUSINESS_1',
  TIERED_BUSINESS_2 = 'TIERED_BUSINESS_2',
  TIERED_BUSINESS_3 = 'TIERED_BUSINESS_3'
}

export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};

// _______ Encrypted Data _______
export type IEncryptedData = {
  encryptedData: string;
  iv: string;
};

//  _______ Account Type _______
export type IAccountType = {
  type: ValidAccountTypes;
  price: number;
  // -1 for unlimited
  maxUsers: number;
  maxPasswords: number;
};

export type IAccountTypeModel = Model<IAccountType>;
export type IAccountTypeDocument = IAccountTypeModel &
  IAccountType &
  Timestamps & {
    _id: Types.ObjectId;
  };

export type IAccountTypeMap = Record<ValidAccountTypes, IAccountType>;
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
  nonce: IEncryptedData;
  user: string | Types.ObjectId;
  expiresAt: Date;
};

export type IAuthSessionModel = Model<IAuthSession>;
export type IAuthSessionDocument = IAuthSessionModel &
  IAuthSession &
  Timestamps & {
    _id: Types.ObjectId;
    user: IUserDocument;
  };

// _________ Login Invites _______
export type ILoginInvite = {
  nonce: IEncryptedData;
  user: string | Types.ObjectId;
  challenge: IEncryptedData;
  expiresAt: Date;
};

export type ILoginInviteModel = Model<ILoginInvite>;

export type ILoginInviteDocument = ILoginInviteModel &
  ILoginInvite &
  Timestamps & {
    _id: Types.ObjectId;
    user: IUserDocument;
  };
