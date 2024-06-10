import {Types} from 'mongoose';

export * from './db';
export * from './crypto';
export * from './models';
export * from './resolvers';
export * from './api-service';

export type AuthContext = {
  user?: {
    _id: Types.ObjectId;
    username: string;
    email: string;
  };
};
