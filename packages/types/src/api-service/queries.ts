/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {Types} from 'mongoose';

export type QueryMeResponse = {
  _id: Types.ObjectId | string;
  username: string;
  email: string;
  userRole?: string;
};
