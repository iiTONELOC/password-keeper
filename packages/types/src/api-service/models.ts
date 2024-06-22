/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {Model, Types} from 'mongoose';

export enum ValidAccountTypes {
  PRO = 'PRO',
  FREE = 'FREE',
  BUSINESS = 'BUSINESS',
  TIERED_BUSINESS_1 = 'TIERED_BUSINESS_1',
  TIERED_BUSINESS_2 = 'TIERED_BUSINESS_2',
  TIERED_BUSINESS_3 = 'TIERED_BUSINESS_3'
}

export enum UserRoles {
  ACCOUNT_OWNER = 'Account Owner',
  SUB_USER = 'Sub User'
}

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
  price: number;
  // -1 for unlimited
  maxUsers: number;
  maxPasswords: number;
  maxPublicKeys: number;
  type: ValidAccountTypes;
};

export type IAccountTypeModel = Model<IAccountType>;
export type IAccountTypeDocument = IAccountTypeModel &
  IAccountType &
  Timestamps & {
    _id: Types.ObjectId;
  };

export type IAccountTypeMap = Record<ValidAccountTypes, IAccountType>;

// _______ Account _______
export enum AccountStatusTypes {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  DELINQUENT = 'DELINQUENT',
  DELETED = 'DELETED'
}

export type IAccount = {
  deletedAt?: Date;
  owner: Types.ObjectId;
  status: AccountStatusTypes;
  subUsers: Types.ObjectId[];
  passwords: Types.ObjectId[];
  publicKeys: Types.ObjectId[];
  accountType: Types.ObjectId;
};

export type IAccountModel = Model<IAccount>;
export type IAccountDocument = IAccountModel &
  IAccount &
  Timestamps & {
    userCount?: number;
    _id: Types.ObjectId;
    passwordCount?: number;
    publicKeyCount?: number;
    status: AccountStatusTypes;
    accountType: IAccountTypeDocument;
    owner: Types.ObjectId | IUserDocument;
    subUsers?: Types.ObjectId[] | IUserDocument[];
    publicKeys?: Types.ObjectId[] | IPublicKeyDocument[];
    passwords?: Types.ObjectId[] | IUserPasswordDocument[];
  };

//  _______ Users _______
export type IUser = {
  username: string;
  email: string;
  userRole: UserRoles;
  owner?: Types.ObjectId | null;
  publicKeys?: Types.ObjectId[];
  account?: Types.ObjectId;
  subUsers?: Types.ObjectId[];
  passwords?: Types.ObjectId[];
};

export type IUserModel = Model<IUser>;
export type IUserDocument = IUserModel &
  IUser &
  Timestamps & {
    _id: Types.ObjectId;
    publicKeys: IPublicKeyDocument[];
    account: IAccountDocument;
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
  label?: string;
  default: boolean;
  expiresAt?: Date;
  description?: string;
  owner: string | Types.ObjectId;
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
  url?: string;
  name: string;
  expiresAt?: Date;
  username: string;
  password: string;
  owner: string | Types.ObjectId;
};

/**
 * Represents how a user would present a password object for storage that
 * has been encrypted using their AES key
 */
export type IPasswordEncrypted = {
  expiresAt?: Date;
  name: IEncryptedData;
  url?: IEncryptedData;
  username: IEncryptedData;
  password: IEncryptedData;
  _id?: string | Types.ObjectId;
  owner: string | Types.ObjectId;
};

/**
 * Represents a password object that has been encrypted for placement in the database
 * using the server-side AES key
 */
export type IPasswordEncryptedAtRest = {
  name: {
    encryptedData: IEncryptedData;
  };
  username: {
    encryptedData: IEncryptedData;
  };
  password: {
    encryptedData: IEncryptedData;
  };
  url?: {
    encryptedData: IEncryptedData;
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
