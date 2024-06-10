import mongoose from 'mongoose';
import {DBConnectionPromise, DBDisconnectPromise} from 'passwordkeeper.types';

/**
 * Connects to the database and returns the default connection object
 *
 * @param dbName Optional name of the database to connect to
 * Defaults to the value of the DB_NAME environment variable or 'test-land'
 * @returns the Mongoose connection object
 */
export default async function connect(dbName?: string): Promise<DBConnectionPromise> {
  // accepts the name as an argument
  // or uses the value of the DB_NAME environment variable
  // if neither are provided, defaults to 'test-land'
  // istanbul ignore next
  const name = dbName ?? process.env.DB_NAME ?? 'pwd-keeper-test';
  // istanbul ignore next
  const URI = process.env.DB_URI ?? `mongodb://127.0.0.1:27017/${name}`;

  // set the strictQuery option to true
  mongoose.set('strictQuery', true);

  // handle any errors that occur when connecting to the database
  try {
    const connection: typeof mongoose = await mongoose.connect(URI);
    return connection;
  } catch (error) {
    // istanbul ignore next
    console.error('Error connecting to the database!\n', error); //NOSONAR
    // istanbul ignore next
    return null;
  }
}

/**
 * Attempts to disconnect from the database
 * @returns true if the connection to the database was successful
 */
export async function disconnectFromDB(database: typeof mongoose): Promise<DBDisconnectPromise> {
  try {
    await database.disconnect();
    return true;
  } catch (error) {
    // istanbul ignore next
    console.error('Error disconnecting from the database!\n', error); //NOSONAR
    // istanbul ignore next
    return false;
  }
}
