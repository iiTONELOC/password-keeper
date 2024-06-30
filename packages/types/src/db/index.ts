import mongoose from 'mongoose';

export * from './models';

export type DBConnection = typeof mongoose | null;
export type DBDisconnectPromise = Promise<boolean>;
export type DBConnectionPromise = Promise<DBConnection>;
