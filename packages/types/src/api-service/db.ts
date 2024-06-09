import mongoose from 'mongoose';

export type DBConnection = typeof mongoose | null;
export type DBDisconnectPromise = Promise<boolean>;
export type DBConnectionPromise = Promise<DBConnection>;
