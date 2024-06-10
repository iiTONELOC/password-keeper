import mongoose from 'mongoose';
import connect, {disconnectFromDB} from '.';
import type {DBConnection} from 'passwordkeeper.types';
import {describe, expect, it, beforeAll, afterAll} from '@jest/globals';

describe('Connection Module', () => {
  let dbConnection: DBConnection = null;

  beforeAll(async () => {
    dbConnection = await connect('pwd-keeper-test');
  });

  afterAll(async () => {
    dbConnection && (await disconnectFromDB(dbConnection));
  });

  it('should return a connection object', () => {
    expect(dbConnection).toBeDefined();
    expect(typeof dbConnection).toEqual(typeof mongoose);

    const nativeConnection: mongoose.Connection | undefined = dbConnection?.connections[0];
    const db: mongoose.mongo.Db | undefined = nativeConnection?.db;
    const namespace: string | undefined = db?.namespace;

    expect(nativeConnection).toBeDefined();
    expect(nativeConnection).toBeInstanceOf(mongoose.Connection);

    expect(db).toBeDefined();
    expect(db).toBeInstanceOf(mongoose.mongo.Db);

    expect(namespace).toBeDefined();
    expect(typeof namespace).toEqual('string');
    expect(namespace).toEqual('pwd-keeper-test');

    expect.assertions(9);
  });

  it('should be able to disconnect from the database', async () => {
    const result = await disconnectFromDB(dbConnection as typeof mongoose);
    expect(result).toEqual(true);
  });

  it('should be able to reconnect to the database', async () => {
    dbConnection = await connect('pwd-keeper-test');

    expect(dbConnection).toBeDefined();
    expect(typeof dbConnection).toEqual(typeof mongoose);
    expect(dbConnection?.connections[0]?.db?.namespace).toEqual('pwd-keeper-test');

    expect.assertions(3);
  });
});
