/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {Types} from 'mongoose';
import {IPasswordEncrypted} from '../db';

export type QueryMeResponse = {
  _id: Types.ObjectId | string;
  username: string;
  email: string;
  account: {
    _id: Types.ObjectId | string;
    accountType: {
      type: string;
    };
  };
};

export type QueryMyPublicKeysResponse = {
  _id: Types.ObjectId | string;
  key: string;
  expiresAt?: Date;
};

export type QueryMyPasswordsResponse = IPasswordEncrypted[];
