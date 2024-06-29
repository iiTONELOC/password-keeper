import {DBConnection} from 'passwordkeeper.types';
import {connectToDB} from 'passwordkeeper.database';
import {ensureRsaKeysExist} from 'passwordkeeper.graphql';

export let db: DBConnection | null = null; // NOSONAR - we want it to me mutable

const globalSetup = async () => {
  db = await connectToDB('pwd-keeper-test');

  await Promise.all([ensureRsaKeysExist()]);
};

export default globalSetup;
