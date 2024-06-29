import {connectToDB} from './src';
import {DBConnection} from 'passwordkeeper.types';
import {seedAccountTypes} from './src/scripts/seedDatabase';

export let db: DBConnection | null = null; // NOSONAR - we want it to me mutable

const globalSetup = async () => {
  db = await connectToDB('pwd-keeper-test');

  await Promise.all([seedAccountTypes()]);
};

export default globalSetup;
