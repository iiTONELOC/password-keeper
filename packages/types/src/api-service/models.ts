/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {Model, Types} from 'mongoose';

export enum ValidAccountTypes {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  TIERED_BUSINESS_1 = 'TIERED_BUSINESS_1',
  TIERED_BUSINESS_2 = 'TIERED_BUSINESS_2',
  TIERED_BUSINESS_3 = 'TIERED_BUSINESS_3'
}

export type UserRoles = 'Account Owner' | 'Sub User';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
  maxPublicKeys: number;
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
  userRole: UserRoles;
  publicKeys?: Types.ObjectId[];
  accountType?: ValidAccountTypes;
  subUsers?: Types.ObjectId[];
  passwords?: Types.ObjectId[];
};

export type IUserModel = Model<IUser>;
export type IUserDocument = IUserModel &
  IUser &
  Timestamps & {
    _id: Types.ObjectId;
    publicKeys: IPublicKeyDocument[];
    accountType: IAccountTypeDocument;
    subUsers: IUserDocument[];
    passwords: IUserPasswordDocument[];
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

// _______ Passwords _______
/**
 * Password objects are encrypted using AES-256-GCM on the client
 * side before being sent to the server. Their data is then encrypted
 * using AES-256-GCM with a server-side key before being stored in the
 * database.
 */

/**
 * Represents a password object that is not encrypted - this is how a user
 * would view a password object that they have decrypted using their AES
 * key
 */
export type IPassword = {
  name: string;
  username: string;
  password: string;
  url?: string;
  owner: string | Types.ObjectId;
  expiresAt?: Date;
};

/**
 * Represents how a user would present a password object for storage that
 * has been encrypted using their AES key
 */
export type IPasswordEncrypted = {
  name: IEncryptedData;
  username: IEncryptedData;
  password: IEncryptedData;
  url?: IEncryptedData;
  owner: string | Types.ObjectId;
  expiresAt?: Date;
};

/**
 * Represents a password object that has been encrypted for placement in the database
 * using the server-side AES key
 */
export type IPasswordEncryptedAtRest = {
  name: {
    encryptedData: IEncryptedData;
    iv: string;
  };
  username: {
    encryptedData: IEncryptedData;
    iv: string;
  };
  password: {
    encryptedData: IEncryptedData;
    iv: string;
  };
  url?: {
    encryptedData: IEncryptedData;
    iv: string;
  };
  expiresAt?: Date;
  owner: Types.ObjectId;
};

export type IUserPasswordModel = Model<IPasswordEncryptedAtRest>;
export type IUserPasswordDocument = IUserPasswordModel &
  IPasswordEncryptedAtRest &
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
